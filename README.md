This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## ClickHouse with Redis Caching

This project includes a ClickHouse wrapper with Redis caching to reduce database workload and improve performance.

### Environment Variables

Create a `.env.local` file with your database credentials:

```env
# ClickHouse Configuration
CLICKHOUSE_HOST=localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your_password
CLICKHOUSE_DB=default

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# AI Chat Configuration
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# MCP Server Configuration
NEXT_PUBLIC_MCP_SERVER_URL=http://127.0.0.1:9001/sse/

# AI Model Configuration
NEXT_PUBLIC_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## AI Chat Feature

The application includes an AI Chat feature powered by:
- **Anthropic Claude models** for intelligent responses
- **Model Context Protocol (MCP)** for tool integration
- **Dynamic tool execution** for data analysis

### Setup Instructions

1. **Get Anthropic API Key**: Visit [Anthropic Console](https://console.anthropic.com/) to get your API key
2. **Copy environment file**: `cp .env.example .env.local`
3. **Configure API key**: Add your Anthropic API key to `.env.local`
4. **Start MCP server**: Ensure your MCP server is running on the configured URL
5. **Access AI Chat**: Navigate to `/ai` in your application

### Available Claude Models

- **claude-3-5-sonnet-20241022** (default) - Most capable for complex reasoning
- **claude-3-5-haiku-20241022** - Fast and efficient for simpler tasks
- **claude-3-opus-20240229** - Highest performance for demanding tasks

### Features

- 🤖 **AI-powered responses** using Anthropic Claude models
- 🔧 **Dynamic tool integration** via MCP protocol
- 📊 **Real-time debugging** with server logs
- ⚙️ **Selectable tools** for custom workflows
- 🔄 **Streaming responses** for better UX
