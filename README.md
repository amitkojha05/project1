# ProjectHub - Multi-Tenant Project Management Tool

A comprehensive full-stack project management application built with Node.js, React, PostgreSQL, Redis, and Kafka.

## 🚀 Features

### Backend
- **REST API** with Express.js
- **JWT Authentication** with role-based access control (Admin/User)
- **PostgreSQL** database with migrations
- **Redis caching** for improved performance
- **Kafka events** for real-time notifications
- **Multi-tenant architecture**
- **Comprehensive error handling**
- **Rate limiting** and security middleware

### Frontend
- **React** with modern hooks and context
- **Role-based route protection**
- **Responsive design** with Tailwind CSS
- **Real-time notifications**
- **Form validation** with react-hook-form
- **Professional UI components**

### Infrastructure
- **Docker Compose** setup for easy deployment
- **Health checks** for all services
- **Environment-based configuration**
- **Automated database migrations**

## 🏗️ Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Node.js API   │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Redis       │    │     Kafka       │
                       │   (Caching)     │    │   (Events)      │
                       └─────────────────┘    └─────────────────┘
\`\`\`

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL with pg driver
- Redis for caching
- Kafka for event streaming
- JWT for authentication
- Joi for validation
- Jest for testing

**Frontend:**
- React 18 with hooks
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- React Hook Form for forms
- React Hot Toast for notifications

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- Apache Kafka with Zookeeper

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd projecthub
\`\`\`

### 2. Start with Docker Compose
\`\`\`bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
\`\`\`

### 3. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

### 4. Demo Credentials
\`\`\`
Admin User:
Email: admin@acme.com
Password: admin123

Regular User:
Email: user@acme.com
Password: admin123
\`\`\`

## 📁 Project Structure

\`\`\`
projecthub/
├── backend/                 # Node.js API
│   ├── config/             # Database, Redis, Kafka config
│   ├── middleware/         # Auth, error handling
│   ├── routes/             # API routes
│   ├── migrations/         # Database migrations
│   ├── __tests__/          # Unit tests
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── App.js          # Main app component
│   └── public/             # Static assets
├── docker-compose.yml      # Docker services
└── README.md              # This file
\`\`\`

## 🔧 Development Setup

### Local Development (without Docker)

1. **Start Infrastructure Services:**
\`\`\`bash
# Start only database, Redis, and Kafka
docker-compose up -d postgres redis zookeeper kafka
\`\`\`

2. **Backend Setup:**
\`\`\`bash
cd backend
npm install
npm run migrate  # Run database migrations
npm run dev      # Start development server
\`\`\`

3. **Frontend Setup:**
\`\`\`bash
cd frontend
npm install
npm start        # Start React development server
\`\`\`

### Environment Variables

Create \`.env\` files in backend directory:

\`\`\`env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=projecthub
DB_USER=admin
DB_PASSWORD=password123
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=your-super-secret-jwt-key-change-in-production
\`\`\`

## 🧪 Testing

### Run Backend Tests
\`\`\`bash
cd backend
npm test
\`\`\`

### Test Coverage
The test suite includes:
- Authentication endpoints
- Project CRUD operations
- Task management
- Role-based access control
- Error handling

## 📚 API Documentation

### Authentication Endpoints

#### Register User
\`\`\`http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "user",
  "tenant_name": "Company Name"
}
\`\`\`

#### Login
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

### Project Endpoints

#### Get All Projects
\`\`\`http
GET /api/projects
Authorization: Bearer <jwt_token>
\`\`\`

#### Create Project (Admin Only)
\`\`\`http
POST /api/projects
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Project Name",
  "description": "Project description",
  "status": "active"
}
\`\`\`

#### Update Project (Admin Only)
\`\`\`http
PUT /api/projects/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "completed"
}
\`\`\`

#### Delete Project (Admin Only)
\`\`\`http
DELETE /api/projects/:id
Authorization: Bearer <jwt_token>
\`\`\`

### Task Endpoints

#### Get Tasks for Project
\`\`\`http
GET /api/tasks/project/:projectId
Authorization: Bearer <jwt_token>
\`\`\`

#### Create Task (Admin Only)
\`\`\`http
POST /api/tasks/project/:projectId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Task Title",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "due_date": "2024-12-31"
}
\`\`\`

#### Update Task (Admin Only)
\`\`\`http
PUT /api/tasks/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Task Title",
  "status": "completed",
  "priority": "high"
}
\`\`\`

#### Delete Task (Admin Only)
\`\`\`http
DELETE /api/tasks/:id
Authorization: Bearer <jwt_token>
\`\`\`

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Role-based Access Control** (Admin/User permissions)
- **Rate Limiting** to prevent abuse
- **Input Validation** with Joi schemas
- **SQL Injection Protection** with parameterized queries
- **CORS Configuration** for cross-origin requests
- **Helmet.js** for security headers
- **Password Hashing** with bcrypt

## 📊 Caching Strategy

- **Redis Caching** for GET /projects endpoint (1-minute TTL)
- **Cache Invalidation** on project create/update/delete
- **Performance Monitoring** with cache hit/miss tracking

## 🔄 Event-Driven Architecture

Kafka events are published for:
- User registration and login
- Project create/update/delete operations
- Task create/update/delete operations

Event structure:
\`\`\`json
{
  "eventType": "project.created",
  "projectId": "123",
  "tenantId": "456",
  "userId": "789",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { ... }
}
\`\`\`

## 🚀 Deployment

### Production Deployment

1. **Update Environment Variables:**
\`\`\`bash
# Update docker-compose.yml with production values
# Change JWT_SECRET, database passwords, etc.
\`\`\`

2. **Deploy with Docker Compose:**
\`\`\`bash
docker-compose -f docker-compose.yml up -d
\`\`\`

3. **Health Checks:**
\`\`\`bash
# Check all services are healthy
docker-compose ps

# Test API health
curl http://localhost:5000/health
\`\`\`

### Scaling Considerations

- **Database:** Use PostgreSQL replicas for read scaling
- **Redis:** Implement Redis Cluster for high availability
- **Kafka:** Add more brokers for event processing
- **API:** Scale horizontally with load balancer

## 🐛 Troubleshooting

### Common Issues

1. **Services not starting:**
\`\`\`bash
# Check logs
docker-compose logs <service-name>

# Restart services
docker-compose restart
\`\`\`

2. **Database connection issues:**
\`\`\`bash
# Check PostgreSQL is running
docker-compose ps postgres

# Run migrations manually
docker-compose exec backend npm run migrate
\`\`\`

3. **Frontend not loading:**
\`\`\`bash
# Check if backend is accessible
curl http://localhost:5000/health

# Rebuild frontend
docker-compose build frontend
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Follows industry best practices
- Designed for scalability and maintainability
- Comprehensive testing and documentation
\`\`\`

## 🔍 Monitoring & Observability

The application includes:
- Health check endpoints
- Structured logging
- Error tracking
- Performance metrics
- Event monitoring

---

**ProjectHub** - Professional Project Management Made Simple
