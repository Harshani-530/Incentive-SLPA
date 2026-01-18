# Incentive System

A React web application built with TypeScript and Vite.

## Prerequisites

Before running this project, you need to install Node.js and npm:

1. Download and install Node.js from [nodejs.org](https://nodejs.org/) (LTS version recommended)
2. Verify installation:
   ```bash
   node --version
   npm --version
   ```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## Project Structure

```
├── public/          # Static assets
├── src/
│   ├── assets/      # Images, fonts, etc.
│   ├── App.tsx      # Main App component
│   ├── App.css      # App styles
│   ├── main.tsx     # Application entry point
│   └── index.css    # Global styles
├── index.html       # HTML template
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── vite.config.ts   # Vite configuration
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Technologies

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **ESLint** - Code linting

## Default Credentials

**Super Admin Account:**
- Username: `is`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## Password Requirements

All passwords must meet the following criteria:
- At least 8 characters long
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@, #, $, %, &, *)
- No spaces allowed
- Cannot be the same as username
- Cannot reuse last 5 passwords

See [PASSWORD_RULES.md](PASSWORD_RULES.md) for detailed information.

## Next Steps

After installing Node.js, run `npm install` to install all dependencies, then start the development server with `npm run dev`.
