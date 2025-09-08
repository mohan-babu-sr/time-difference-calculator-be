const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error(err));

// Define a schema & model
const DataSchema = new mongoose.Schema({
    date: Date,
    inTime: String,
    outTime: String,
    location: String
});
const DataModel = mongoose.model('Data', DataSchema);

// GET all records
app.get('/api', async (req, res) => {
    const data = await DataModel.find();
    res.json(data);
});

// GET a record by Date
app.get('/api/filter', async (req, res) => {
    try {
        let filteredData = [];
        const { date } = req.query;
        const { monthYear } = req.query;
        console.log(monthYear);
        if (date) {
            if (!date) {
                return res.status(400).json({ message: 'Please provide a date in YYYY-MM-DD format' });
            }

            const selectedDate = new Date(date);
            const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

            filteredData = await DataModel.find({
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
        } else if (monthYear) {
            if (!/^\d{4}-\d{2}$/.test(monthYear)) {
                return res.status(400).json({ message: 'Please provide a month in YYYY-MM format' });
            }

            const [year, monthNum] = monthYear.split('-').map(Number);
            const startOfMonth = new Date(year, monthNum - 1, 1);
            const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);

            filteredData = await DataModel.find({
                date: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            });
        } else {
            return res.status(400).json({ message: 'Please provide either date or month parameter' });
        }
        console.log('Filter API called: ', filteredData);

        res.json(filteredData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data', error });
    }
});

// POST a new record
app.post('/api', async (req, res) => {
    const newData = new DataModel(req.body);
    await newData.save();
    res.json({ message: 'Data added successfully' });
});

app.put('/api/:id', async (req, res) => {
    try {
        const updatedData = await DataModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedData) {
            return res.status(404).json({ message: 'Data not found', data: req.body });
        }

        res.json({ message: 'Data updated successfully', _id: updatedData._id });
    } catch (error) {
        res.status(500).json({ message: 'Error updating data', error: error.message });
    }
});

// DELETE a record
app.delete('/api/:id', async (req, res) => {
    await DataModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Data deleted successfully' });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
