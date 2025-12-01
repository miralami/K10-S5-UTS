# AI Analysis Service (Python gRPC)

A Python gRPC service that wraps the Google Gemini API for journal mood analysis.

## Features

- **Daily Analysis**: Analyze a user's journal notes for a specific day
- **Weekly Analysis**: Aggregate daily summaries into a weekly mood report

## Prerequisites

- Python 3.10+
- Google Gemini API Key (set as `GOOGLE_GENAI_API_KEY` environment variable)

## Installation

```bash
cd ai-service
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

## Generate gRPC Code

```bash
python -m grpc_tools.protoc -I../shared/proto --python_out=. --grpc_python_out=. ../shared/proto/ai.proto
```

## Run the Server

```bash
# Set your API key
$env:GOOGLE_GENAI_API_KEY = "your-api-key"

# Run
python server.py
```

The server listens on `0.0.0.0:50052` by default.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_GENAI_API_KEY` | Google Gemini API key | (required) |
| `GRPC_PORT` | Port for gRPC server | `50052` |
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.0-flash` |

## Proto Definition

See `../shared/proto/ai.proto` for the service definition.
