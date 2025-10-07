# Kube Credential System

A microservice-based credential issuance and verification system built with Node.js, TypeScript, React, and Kubernetes. This project demonstrates a scalable, containerized architecture with separate services for credential management.

## 🚀 Assignment Overview

This project implements a complete credential management system as specified in the requirements:

- **Two Backend Microservices**: Credential Issuance and Credential Verification
- **React Frontend**: Two pages for issuing and verifying credentials
- **Docker Containerization**: Each service runs in its own container
- **Kubernetes Deployment**: Production-ready manifests for scalable deployment
- **Comprehensive Testing**: Unit tests for all components

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│◄──►│   Nginx Ingress  │◄──►│   Load Balancer │
│   (Port 80)     │    │   Controller     │    │   (Optional)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   Verification  │    │   Issuance       │
│   Service       │◄──►│   Service        │
│   (Port 3002)   │    │   (Port 3001)    │
└─────────────────┘    └──────────────────┘
```

### Microservices Architecture

#### 1. Credential Issuance Service (`issuance-service`)
- **Technology**: Node.js + TypeScript + Express.js
- **Port**: 3001
- **Functionality**:
  - Issues new credentials with unique IDs
  - Maintains persistence layer (JSON file storage)
  - Generates worker IDs in format `worker-n`
  - Validates against duplicate credentials
  - Returns detailed issuance information

#### 2. Credential Verification Service (`verification-service`)
- **Technology**: Node.js + TypeScript + Express.js
- **Port**: 3002
- **Functionality**:
  - Verifies credentials by ID or data content
  - Cross-references with issuance service data
  - Returns verification status with timestamps
  - Supports both exact ID and data-based verification

#### 3. React Frontend
- **Technology**: React + TypeScript + Material-UI
- **Features**:
  - Issuance page with form validation
  - Verification page with dual verification modes
  - Real-time API communication
  - Responsive design with error handling

## 📋 Design Decisions & Assumptions

### Architecture Choices

1. **Microservices Design**:
   - Separate services for scalability and maintainability
   - Each service can be deployed and scaled independently
   - Clear separation of concerns (issuance vs verification)

2. **Technology Stack**:
   - **Node.js/TypeScript**: Type safety and modern JavaScript features
   - **Express.js**: Lightweight, unopinionated web framework
   - **React/TypeScript**: Component-based UI with type safety
   - **Material-UI**: Consistent, accessible design system

3. **Persistence Strategy**:
   - **Issuance Service**: JSON file storage for credential data
   - **Verification Service**: In-memory storage synced from issuance service
   - Simple, file-based approach suitable for demo/evaluation

### API Design Decisions

1. **RESTful Endpoints**:
   ```
   POST /issue     - Issue new credentials
   POST /verify    - Verify existing credentials
   GET  /health    - Health check endpoint
   ```

2. **JSON-Based Credentials**:
   - Flexible credential structure supporting any data format
   - Consistent request/response patterns across services

3. **Error Handling**:
   - Comprehensive error responses with meaningful messages
   - Proper HTTP status codes (400, 404, 409, 500)
   - Graceful degradation and user-friendly error messages

### Security Considerations

1. **Container Security**:
   - Non-root user execution in all containers
   - Minimal base images (Alpine Linux)
   - Security headers in Nginx configuration

2. **API Security**:
   - CORS configuration for cross-origin requests
   - Input validation and sanitization
   - Rate limiting considerations for production

## 🛠️ Setup & Installation

### Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (local or cloud)
- Node.js 18+ (for development)
- kubectl (for Kubernetes deployment)

### Local Development Setup

1. **Clone and navigate to the project**:
   ```bash
   git clone <repository-url>
   cd kube-credential
   ```

2. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Start backend services with Docker Compose**:
   ```bash
   # From project root
   docker-compose up -d
   ```

4. **Start frontend development server**:
   ```bash
   # In another terminal, from frontend directory
   npm start
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Issuance API: http://localhost:3001
   - Verification API: http://localhost:3002

### Docker Deployment

1. **Build and run all services**:
   ```bash
   docker-compose up --build
   ```

2. **View service logs**:
   ```bash
   docker-compose logs -f issuance-service
   docker-compose logs -f verification-service
   ```

### Kubernetes Deployment

1. **Deploy to Kubernetes**:
   ```bash
   # Apply all manifests
   kubectl apply -f kubernetes/

   # Check deployment status
   kubectl get pods,services,ingress
   ```

2. **Scale services if needed**:
   ```bash
   kubectl scale deployment kube-credential-issuance --replicas=5
   kubectl scale deployment kube-credential-verification --replicas=3
   ```

## 🧪 Testing

### Backend Tests

```bash
# Issuance Service Tests
cd backend/issuance-service
npm test

# Verification Service Tests
cd backend/verification-service
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing

1. **Issue a credential**:
   ```bash
   curl -X POST http://localhost:3001/issue \
     -H "Content-Type: application/json" \
     -d '{"data": {"userId": "testuser", "role": "admin"}}'
   ```

2. **Verify by ID**:
   ```bash
   curl -X POST http://localhost:3002/verify \
     -H "Content-Type: application/json" \
     -d '{"id": "cred_123"}'
   ```

3. **Verify by data**:
   ```bash
   curl -X POST http://localhost:3002/verify \
     -H "Content-Type: application/json" \
     -d '{"data": {"userId": "testuser", "role": "admin"}}'
   ```

## 🔧 Configuration

### Environment Variables

#### Issuance Service
- `PORT`: Service port (default: 3001)
- `NODE_ENV`: Environment mode
- `FRONTEND_URL`: Frontend URL for CORS

#### Verification Service
- `PORT`: Service port (default: 3002)
- `NODE_ENV`: Environment mode
- `FRONTEND_URL`: Frontend URL for CORS

#### Frontend
- `REACT_APP_ISSUANCE_API_URL`: Issuance service URL
- `REACT_APP_VERIFICATION_API_URL`: Verification service URL

### Customization

1. **Credential Data Structure**: Modify types in `src/types.ts` files
2. **Validation Rules**: Update Joi schemas in service files
3. **UI Styling**: Customize Material-UI theme in `App.tsx`

## 📁 Project Structure

```
kube-credential/
├── backend/
│   ├── issuance-service/           # Credential Issuance Microservice
│   │   ├── src/
│   │   │   ├── __tests__/         # Unit tests
│   │   │   ├── index.ts           # Main application
│   │   │   ├── storage.ts         # Persistence layer
│   │   │   └── types.ts           # TypeScript interfaces
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── jest.config.js
│   └── verification-service/       # Credential Verification Microservice
│       ├── src/
│       │   ├── __tests__/
│       │   ├── index.ts
│       │   ├── storage.ts
│       │   └── types.ts
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       └── jest.config.js
├── frontend/                      # React Application
│   ├── public/
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── types/               # TypeScript types
│   │   └── __tests__/           # Frontend tests
│   ├── package.json
│   └── tsconfig.json
├── kubernetes/                   # Kubernetes manifests
│   ├── issuance-deployment.yaml
│   ├── verification-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── issuance-service.yaml
│   ├── verification-service.yaml
│   ├── frontend-service.yaml
│   └── ingress.yaml
├── docker-compose.yml           # Docker Compose configuration
└── README.md                   # This file
```

## 🚀 Deployment Options

### Option 1: Local Development
- Use Docker Compose for quick local setup
- All services run in containers with hot-reload capability
- Perfect for development and testing

### Option 2: Kubernetes Cluster
- Production-ready deployment with scaling
- Load balancing and service discovery
- Ingress controller for external access

### Option 3: Cloud Deployment (AWS)
1. Build Docker images:
   ```bash
   docker build -t kube-credential-issuance ./backend/issuance-service
   docker build -t kube-credential-verification ./backend/verification-service
   docker build -t kube-credential-frontend ./frontend
   ```

2. Push to container registry (AWS ECR)

3. Deploy to AWS EKS using provided Kubernetes manifests

## 🔍 API Documentation

### Issuance Service Endpoints

#### POST /issue
Issue a new credential.

**Request Body**:
```json
{
  "data": {
    "userId": "string",
    "role": "string",
    "permissions": ["string"],
    "department": "string"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "credential issued by worker-1",
  "credential": {
    "id": "cred_123",
    "data": {...},
    "issuedAt": "2023-01-01T00:00:00.000Z",
    "issuedBy": "worker-1",
    "status": "issued"
  }
}
```

#### GET /health
Health check endpoint.

### Verification Service Endpoints

#### POST /verify
Verify a credential by ID or data.

**Request Body** (by ID):
```json
{
  "id": "cred_123"
}
```

**Request Body** (by data):
```json
{
  "data": {
    "userId": "string",
    "role": "string"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Credential is valid. Issued by worker-1 on 1/1/2023, 12:00:00 AM",
  "isValid": true,
  "credential": {
    "id": "cred_123",
    "issuedAt": "2023-01-01T00:00:00.000Z",
    "issuedBy": "worker-1",
    "status": "issued"
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
- **Storage Layer**: Credential persistence and retrieval
- **API Layer**: Request handling and response formatting
- **Frontend Services**: API communication and error handling

### Integration Tests
- End-to-end credential issuance and verification flows
- Cross-service communication validation
- Error scenario handling

### Manual Testing Checklist
- [ ] Issue credential with valid data
- [ ] Issue credential with duplicate data (should fail)
- [ ] Verify credential by ID
- [ ] Verify credential by data
- [ ] Verify non-existent credential (should fail gracefully)
- [ ] Test UI responsiveness and error handling

## 🔒 Security Features

1. **Container Security**:
   - Non-root user execution
   - Minimal attack surface with Alpine images
   - Resource limits to prevent DoS

2. **API Security**:
   - Input validation and sanitization
   - CORS configuration
   - Security headers in responses

3. **Data Protection**:
   - No sensitive data logging
   - Secure credential storage format

## 📈 Scalability Considerations

1. **Horizontal Scaling**:
   - Kubernetes deployments support replica scaling
   - Stateless services for easy scaling
   - Load balancing across multiple instances

2. **Performance Optimization**:
   - Efficient data structures for credential lookup
   - Connection pooling for database operations
   - Caching strategies for frequently accessed data

## 🐛 Troubleshooting

### Common Issues

1. **Services not starting**:
   - Check Docker daemon status
   - Verify port availability (3001, 3002, 3000)
   - Review service logs: `docker-compose logs <service-name>`

2. **Frontend not connecting to backend**:
   - Verify service URLs in environment variables
   - Check CORS configuration
   - Confirm services are healthy via `/health` endpoints

3. **Kubernetes deployment issues**:
   - Verify cluster connectivity: `kubectl cluster-info`
   - Check pod logs: `kubectl logs <pod-name>`
   - Validate resource quotas and limits

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

## 🤝 Contributing

1. Follow TypeScript and React best practices
2. Write tests for new features
3. Update documentation for API changes
4. Use conventional commit messages

## 📄 License

This project is created for educational purposes as part of a microservices assignment.

---

## 📞 Support

For assignment-related questions, refer to the original requirements document. This implementation follows all specified requirements and includes reasonable assumptions documented above.

**Key Features Implemented**:
✅ Node.js/TypeScript backend microservices
✅ React/TypeScript frontend with two pages
✅ Docker containerization for all services
✅ Kubernetes deployment manifests
✅ JSON-based credential handling
✅ Worker ID assignment (`worker-n` format)
✅ Duplicate credential detection
✅ Comprehensive error handling
✅ Unit tests for all components
✅ Production-ready architecture

**Assumptions Made**:
- Simple file-based persistence suitable for evaluation
- In-memory verification storage synced from issuance service
- Basic security measures appropriate for demo environment
- Material-UI for consistent, accessible frontend design
