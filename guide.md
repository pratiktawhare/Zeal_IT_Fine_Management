# Deployment Guide for College Fine Management System

This guide outlines the step-by-step process to deploy the **MERN Stack College Fine Management System**.

We will deploy:
1.  **Backend** on [Render](https://render.com) (free tier available).
2.  **Frontend** on [Vercel](https://vercel.com) (free tier available).

---

## Prerequisites

1.  **GitHub Repository**: Ensure your project is pushed to a GitHub repository.
2.  **MongoDB Atlas**: You need a cloud MongoDB database.
    *   Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
    *   Create a free cluster.
    *   Get the connection string (URI). It looks like: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/college_fine_db`.

---

## Phase 1: Deploy Backend (Render)

We deploy the backend first because the frontend needs the live backend URL to function.

1.  **Create a Render Account**
    *   Go to [dashboard.render.com](https://dashboard.render.com/) and sign up/log in with GitHub.

2.  **Create New Web Service**
    *   Click the **"New +"** button and select **"Web Service"**.
    *   Select **"Build and deploy from a Git repository"**.
    *   Connect your **GitHub repository**.

3.  **Configure the Service**
    Fill in the following details:
    *   **Name**: `college-fine-backend` (or your preferred name).
    *   **Region**: Choose the one closest to you (e.g., Singapore, Oregon).
    *   **Branch**: `main` (or your default branch).
    *   **Root Directory**: `backend` (CRITICAL: Currently your server.js is inside the backend folder).
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`

4.  **Environment Variables**
    Scroll down to the "Environment Variables" section and add the following keys using values from your `backend/.env` file:

    | Key | Value |
    | :--- | :--- |
    | `MONGO_URI` | Your MongoDB Atlas Connection String |
    | `JWT_SECRET` | A complex random string (e.g., `supersecretkey123`) |
    | `NODE_ENV` | `production` |
    | `EMAIL_USER` | (Optional) Your Gmail address for emails |
    | `EMAIL_PASS` | (Optional) Your Gmail App Password |

5.  **Deploy**
    *   Click **"Create Web Service"**.
    *   Render will start building your app. Wait for it to say causing "Live".
    *   **Copy the Service URL** from the top left (e.g., `https://college-fine-backend.onrender.com`). You will need this for the frontend.

---

## Phase 2: Deploy Frontend (Vercel)

1.  **Create a Vercel Account**
    *   Go to [vercel.com](https://vercel.com/) and sign up/log in with GitHub.

2.  **Add New Project**
    *   Click **"Add New..."** -> **"Project"**.
    *   Import the same **GitHub repository**.

3.  **Configure the Project**
    *   **Project Name**: `college-fine-frontend`.
    *   **Framework Preset**: Ensure **Vite** is selected.
    *   **Root Directory**: Click "Edit" and select the `frontend` folder.

4.  **Build Settings**
    *   Vercel should auto-detect these, but confirm:
        *   **Build Command**: `vite build`
        *   **Output Directory**: `dist`
        *   **Install Command**: `npm install`

5.  **Environment Variables (CRITICAL)**
    *   Expand the "Environment Variables" section.
    *   Add the following variable to connect to your backend:

    | Key | Value |
    | :--- | :--- |
    | `VITE_API_URL` | `https://your-backend-url.onrender.com/api` |

    > **Important**: Paste the Render URL you copied earlier and append `/api` to the end.

6.  **Deploy**
    *   Click **"Deploy"**.
    *   Vercel will install dependencies, build the project, and deploy it.
    *   Once done, you will get a live URL (e.g., `https://college-fine-frontend.vercel.app`).

---

## Phase 3: Verification

1.  Open your **Vercel Frontend URL**.
2.  Open the **Developer Console** (F12) -> **Network** tab.
3.  Try to **Login** or perform an action.
4.  If the request goes to your Render backend (and not localhost), the deployment is successful!

---

## Troubleshooting

*   **CORS Errors**: If you verify the network request and see a CORS error, check your backend `server.js`. Ensure your CORS configuration allows the Vercel domain.
    *   *Quick Fix*: In `backend/server.js`, `app.use(cors())` allows all origins by default, which is fine for initial testing. For production security, you can specify the origin:
        ```javascript
        app.use(cors({
            origin: ["https://college-fine-frontend.vercel.app"],
            credentials: true
        }));
        ```
*   **MongoDB Connection Error**: Ensure "Network Access" in MongoDB Atlas allows "Access from Anywhere" (0.0.0.0/0) so Render can connect to it.
