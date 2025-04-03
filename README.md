# Q-Qwen-Web

A web application for interacting with the [Qwen2.5-0.5B-Quantum-Computing-Instruct](https://huggingface.co/ahmeterdempmk/Qwen2.5-0.5B-Quantum-Computing-Instruct) model, featuring a modern frontend and efficient backend architecture.

## Features

- Modern and responsive web interface
- Real-time communication with Qwen language models
- Efficient backend API handling
- Hot-reloading for development
- Graceful server shutdown handling

## Prerequisites

- Node.js (v16 or higher)
- Python 3.8 or higher
- npm (Node Package Manager)
- pip (Python Package Manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ahmeterdempmk/Q-Qwen-Web.git
cd Q-Qwen-Web
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

3. Install backend dependencies:
```bash
cd backend
pip3 install -r requirements.txt
cd ..
```

## Running the Application

1. Start both frontend and backend servers using the provided script:
```bash
./run.sh
```

This will:
- Start the backend server using uvicorn
- Start the frontend development server
- Enable hot-reloading for both servers
- Handle graceful shutdown with Ctrl+C

2. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Development

- Frontend code is located in the `frontend/` directory
- Backend code is located in the `backend/` directory
- The `run.sh` script manages both servers and handles graceful shutdown

## License

This project is licensed under the terms specified in the LICENSE file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request