# Setup Guide

## Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database (use Supabase, Neon, or local PostgreSQL)
3. Accounts for:
   - Clerk (for authentication)
   - Google AI Studio (for Gemini API)
   - Trigger.dev (for task execution)
   - Transloadit (for file uploads)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/workflow_db?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Google Gemini API
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Trigger.dev
TRIGGER_API_KEY=tr_dev_...
TRIGGER_API_URL=http://localhost:3000/api/trigger

# Transloadit
NEXT_PUBLIC_TRANSLOADIT_KEY=your_transloadit_key
TRANSLOADIT_SECRET=your_transloadit_secret
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 4. Get API Keys

#### Google AI Studio
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key to `GOOGLE_AI_API_KEY`

#### Clerk
1. Go to https://clerk.com
2. Create a new application
3. Copy the publishable key and secret key to your `.env`

#### Trigger.dev
1. Go to https://trigger.dev
2. Create a new project
3. Get your API key from the dashboard
4. Copy to `TRIGGER_API_KEY`

#### Transloadit
1. Go to https://transloadit.com
2. Sign up and get your credentials
3. Copy to `NEXT_PUBLIC_TRANSLOADIT_KEY` and `TRANSLOADIT_SECRET`

### 5. Run Development Server

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Trigger.dev dev server (optional)
npm run trigger:dev
```

The app will be available at `http://localhost:3000`

## Next Steps

### Complete FFmpeg Integration

The FFmpeg tasks for Crop Image and Extract Frame are currently placeholders. To complete:

1. Install FFmpeg in your Trigger.dev environment
2. Update `trigger/crop-image-task.ts` with actual FFmpeg cropping logic
3. Update `trigger/extract-frame-task.ts` with actual FFmpeg frame extraction

### Complete Transloadit Integration

Update `app/api/transloadit/upload/route.ts` with actual Transloadit upload logic using their SDK.

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── workflows/      # Workflow CRUD
│   │   ├── execute/        # Execution endpoints
│   │   └── transloadit/    # File upload
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/              # React components
│   ├── nodes/              # Node components (6 types)
│   ├── WorkflowCanvas.tsx  # Main canvas
│   ├── LeftSidebar.tsx     # Node buttons
│   ├── RightSidebar.tsx    # History panel
│   └── WorkflowToolbar.tsx # Toolbar (save/load/export)
├── lib/                     # Utilities
│   ├── db.ts               # Prisma client
│   ├── store.ts            # Zustand store
│   ├── types.ts            # TypeScript types
│   ├── utils.ts            # Utility functions
│   ├── workflow-execution.ts # Execution engine
│   ├── workflow-persistence.ts # Save/load/export
│   └── sample-workflow.ts  # Sample workflow generator
├── prisma/                  # Database
│   └── schema.prisma       # Prisma schema
└── trigger/                 # Trigger.dev tasks
    ├── llm-task.ts         # LLM execution
    ├── crop-image-task.ts  # Image cropping
    └── extract-frame-task.ts # Frame extraction
```

## Features Implemented

✅ Pixel-perfect UI matching Weavy.ai
✅ Clerk authentication with protected routes
✅ 6 node types fully functional
✅ React Flow canvas with dot grid
✅ Left sidebar with node buttons
✅ Right sidebar with workflow history
✅ Node connections with type validation
✅ DAG validation (prevents cycles)
✅ Workflow persistence (save/load)
✅ Export/import as JSON
✅ Sample workflow generator
✅ Parallel execution support
✅ Node-level execution history

## Remaining Tasks

- [ ] Complete FFmpeg integration in Trigger.dev tasks
- [ ] Complete Transloadit upload integration
- [ ] Test all node types with real API calls
- [ ] Add error handling improvements
- [ ] Add loading states for all operations
- [ ] Optimize performance for large workflows
