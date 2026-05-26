const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'supersecretkey_change_in_production';

// --- Database Connection (SQLite via Sequelize) ---
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const Task = sequelize.define('Task', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'todo' // changed from completed boolean for kanban
  }
});

// Relationships
User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

const Project = sequelize.define('Project', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  }
});

User.hasMany(Project, { foreignKey: 'userId' });
Project.belongsTo(User, { foreignKey: 'userId' });

// Initialize database
sequelize.sync()
  .then(() => console.log('🔥 SQLite Database Connected & Synced Successfully'))
  .catch(err => console.error('SQLite connection error:', err));

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });
    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

app.post('/api/register', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const newUser = await User.create({ username: req.body.username, password: hashedPassword });
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ where: { username: req.body.username } });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Invalid password' });
    const token = jwt.sign({ _id: user.id }, JWT_SECRET);
    res.header('Authorization', token).json({ token });
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const task = await Task.create({ ...req.body, userId: req.user._id });
        res.json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await Task.findAll({ 
            where: { userId: req.user._id },
            order: [['createdAt', 'DESC']]
        });
        res.json(tasks);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const [updatedRowsCount] = await Task.update(req.body, {
            where: { id: req.params.id, userId: req.user._id }
        });
        if (updatedRowsCount === 0) return res.status(404).json({ message: 'Task not found or not authorized' });
        
        const updatedTask = await Task.findOne({ where: { id: req.params.id } });
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const deletedRowsCount = await Task.destroy({ where: { id: req.params.id, userId: req.user._id } });
        if (deletedRowsCount === 0) return res.status(404).json({ message: 'Task not found or not authorized' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
        const project = await Project.create({ ...req.body, userId: req.user._id });
        res.json(project);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const projects = await Project.findAll({ 
            where: { userId: req.user._id },
            order: [['createdAt', 'DESC']]
        });
        res.json(projects);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const deletedRowsCount = await Project.destroy({ where: { id: req.params.id, userId: req.user._id } });
        if (deletedRowsCount === 0) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));