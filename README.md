# ProjectHub - Multi-Tenant Project Management Tool

A full-stack project management application built with Node.js, React, PostgreSQL, Redis, and Kafka. This application demonstrates modern web development practices including JWT authentication, role-based access control, caching, and event-driven architecture.

## 🚀 Features

### Backend
- **REST API** with Node.js and Express
- **JWT Authentication** with role-based access control (Admin/User)
- **PostgreSQL** database with migrations
- **Redis caching** for improved performance (1-minute TTL for projects)
- **Kafka events** for real-time notifications on CRUD operations
- **Comprehensive error handling** and validation
- **Unit tests** with Jest and Supertest

### Frontend
- **React** application with modern hooks and context
- **Role-based route protection** (Admin can edit, Users can view)
- **Responsive design** with Tailwind CSS
- **Real-time notifications** with React Hot Toast
- **Form validation** with React Hook Form
- **Professional UI** with modern components

### Infrastructure
- **Docker Compose** setup for easy deployment
- **Health checks** for all services
- **Environment-based configuration**
- **Graceful shutdown handling**

## 🏗️ Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │────│   Node.js API   │────│   PostgreSQL    │
│   (Port 3000)   │    │   (Port 5000)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              │                         │
                       ┌─────────────────┐    ┌─────────────────┐
                       │      Redis      │    │      Kafka      │
                       │   (Port 6379)   │    │   (Port 9092)   │
                       └─────────────────┘    └─────────────────┘
\`\`\`

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (Database)
- Redis (Caching)
- Kafka (Event Streaming)
- JWT (Authentication)
- Joi (Validation)
- Jest + Supertest (Testing)

**Frontend:**
- React 18
- React Router DOM
- React Hook Form
- Axios (HTTP Client)
- Tailwind CSS
- React Hot Toast
- Lucide React (Icons)

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- Kafka (Confluent Platform)

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd projecthub
\`\`\`

2. **Start the application**
\`\`\`bash
docker-compose up -d
\`\`\`

3. **Wait for services to be ready** (about 2-3 minutes for first startup)
\`\`\`bash
# Check service health
docker-compose ps
\`\`\`

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

### Demo Accounts

The application comes with pre-configured demo accounts:

**Admin Account:**
- Email: `admin@acme.com`
- Password: `admin123`
- Permissions: Full CRUD access to projects and tasks

**User Account:**
- Email: `user@acme.com`
- Password: `admin123`
- Permissions: Read-only access to projects and tasks

## 📖 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user" // or "admin"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
\`\`\`

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
\`\`\`

### Project Endpoints

#### GET /api/projects
Get all projects for the authenticated user (cached for 1 minute).

**Headers:**
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

**Response:**
\`\`\`json
{
  "projects": [
    {
      "id": 1,
      "name": "Website Redesign",
      "description": "Complete redesign of company website",
      "status": "active",
      "task_count": 5,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "cached": false
}
\`\`\`

#### POST /api/projects
Create a new project (Admin only).

**Headers:**
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

**Request Body:**
\`\`\`json
{
  "name": "New Project",
  "description": "Project description",
  "status": "active"
}
\`\`\`

#### PUT /api/projects/:id
Update an existing project (Admin only).

#### DELETE /api/projects/:id
Delete a project and all associated tasks (Admin only).

### Task Endpoints

#### GET /api/tasks/project/:projectId
Get all tasks for a specific project.

#### POST /api/tasks/project/:projectId
Create a new task in a project (Admin only).

**Request Body:**
\`\`\`json
{
  "title": "Task Title",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "due_date": "2024-12-31"
}
\`\`\`

#### PUT /api/tasks/:id
Update an existing task (Admin only).

#### DELETE /api/tasks/:id
Delete a task (Admin only).

## 🧪 Testing

### Backend Tests

Run the test suite:
\`\`\`bash
# Enter backend container
docker-compose exec backend bash

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
\`\`\`

### Test Coverage
- Authentication flow testing
- Project CRUD operations
- Task management testing
- Role-based access validation
- Error handling verification

## 🔧 Development

### Local Development Setup

1. **Backend Development**
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

2. **Frontend Development**
\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

### Environment Variables

**Backend (.env):**
\`\`\`env
NODE_ENV=development
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=projecthub
DB_USER=admin
DB_PASSWORD=password123
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:9092
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
\`\`\`

**Frontend (.env):**
\`\`\`env
REACT_APP_API_URL=http://localhost:5000/api
\`\`\`

## 🔒 Security Features

- **JWT Token Authentication** with secure secret
- **Password Hashing** using bcrypt with salt rounds
- **Role-Based Access Control** (Admin/User permissions)
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS Protection** with configurable origins
- **Input Validation** using Joi schemas
- **SQL Injection Prevention** with parameterized queries
- **Security Headers** via Helmet.js

## 📊 Performance Features

- **Redis Caching** for frequently accessed data (1-minute TTL)
- **Database Indexing** on commonly queried columns
- **Connection Pooling** for efficient database usage
- **Gzip Compression** for API responses
- **Lazy Loading** for React components

## 🎯 Event-Driven Architecture

The application uses Kafka for event streaming:

**Published Events:**
- `project.created` - When a new project is created
- `project.updated` - When a project is modified
- `project.deleted` - When a project is removed
- `task.created` - When a new task is created
- `task.updated` - When a task is modified
- `task.deleted` - When a task is removed

**Event Structure:**
\`\`\`json
{
  "id": "resource_id",
  "name": "resource_name",
  "action": "created|updated|deleted",
  "user_id": "user_id",
  "user_email": "user@example.com",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

## 🐳 Docker Services

- **postgres**: PostgreSQL 15 database
- **redis**: Redis 7 for caching
- **zookeeper**: Zookeeper for Kafka coordination
- **kafka**: Kafka message broker
- **backend**: Node.js API server
- **frontend**: React development server

## 🔍 Monitoring & Health Checks

All services include health checks:
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **Kafka**: Topic listing verification
- **Backend**: HTTP health endpoint at `/health`

## 🚀 Production Deployment

For production deployment:

1. **Update environment variables** with production values
2. **Change JWT secret** to a secure random string
3. **Configure proper CORS origins**
4. **Set up SSL/TLS certificates**
5. **Configure production database**
6. **Set up monitoring and logging**
7. **Configure backup strategies**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web development best practices
- Follows RESTful API design principles
- Implements enterprise-level security measures
- Uses industry-standard tools and frameworks

---

**ProjectHub** - Demonstrating full-stack development expertise with modern technologies and architectural patterns.
