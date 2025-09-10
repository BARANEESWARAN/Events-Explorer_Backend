# 🔐 Advanced Authentication Features

## Biometric Authentication System
- **Fingerprint/Face ID Login**: Seamless biometric authentication using WebAuthn standards  
- **Multiple Device Support**: Register biometric credentials on multiple devices  
- **Secure Enrollment**: One-time biometric registration process  
- **Fallback Options**: Traditional email/password login always available  

## Biometric Registration Flow
1. User signs up with email/password first  
2. Navigates to **Profile → Biometric Settings**  
3. One-click registration captures biometric data  
4. Credentials securely stored in Firebase  
5. Future logins can use fingerprint/face recognition  

## Biometric Management
- **Enable/Disable**: Toggle biometric login in profile settings  
- **Multiple Devices**: Register biometrics on different devices  
- **Secure Storage**: Biometric data never leaves your device  
- **Revocation**: Easily remove biometric credentials if needed  

---

# City Pulse - Event Discovery App

City Pulse is a modern event discovery application that helps users find, save, and manage events in their city with ease. The app features secure authentication, event browsing by name or city, favorite event management, and interactive maps.

---

## 🚀 Live Demo

Check out the live application: [https://city-pulse-m866.onrender.com](https://city-pulse-m866.onrender.com)

---

## 📱 Application Features

1. **Authentication System**  
   - Sign Up/Login with email and password  
   - Simulated biometric authentication for demo  
   - Secure user profiles using Firebase Authentication  

2. **Event Discovery**  
   - Browse featured events on the home page  
   - Search events by **event name or city**  
   - Clicking search without input shows **all default events**  
   - Click events to view detailed information  
   - Add events to favorites with one click  

3. **Favorites Management**  
   - Save favorite events easily  
   - View all favorites in your profile  
   - Persistent storage via Firebase, synced with **localStorage** for quick access  

4. **User Profiles**  
   - Edit profile info (name, photo URL)  
   - Manage biometric authentication settings  
   - View and manage favorite events  

5. **Event Details**  
   - Comprehensive details including date, venue, and pricing  
   - Interactive maps with Google Maps integration  

---

## 🛠️ Technology Stack

- **Frontend:** React.js with React Router  
- **Authentication:** Firebase Auth  
- **Database:** Firebase Firestore  
- **Events API:** Ticketmaster Discovery API  
- **Maps:** Google Maps API  
- **Styling:** CSS3 with responsive design  
- **Icons:** Font Awesome  
- **State Management:** React Context API  

---

## 📦 Frontend Setup

Since the `.env` file is already configured with Firebase and API keys, you just need to follow these steps:

1. **Clone the repository**  
   ```bash
   git clone https://github.com/yourusername/city-pulse-app.git
   cd city-pulse-app
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Run the development server**  
   ```bash
   npm run dev
   ```

4. **Open your browser**  
   Navigate to [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Backend Setup

1. **Clone the repository**  
   ```bash
   git clone https://github.com/yourusername/city-pulse-backend.git
   cd city-pulse-backend
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root and add the following:  
   ```env
   CLIENT_URL=http://localhost:5173
   RP_ID=localhost
   RP_NAME=City Pulse
   PORT=3000
   ```

4. **Run the backend server**  
   ```bash
   npm run dev
   ```

---

## 🎯 Usage Guide

### For Users
- Sign up or login with your credentials  
- Browse events on the home page  
- Use the search bar to find events **by event name or city**  
- Click search without typing anything to view **all default events**  
- Add events to favorites using the heart icon  
- Visit your profile to manage favorites and update personal info  
- Enable or disable biometric login in profile settings  

---

## 📖 Page Overview

### 🔐 Sign Up / Login Page
![Login](https://github.com/user-attachments/assets/b81cdaee-a318-4580-a16c-ec17df5be785)  
![Signup](https://github.com/user-attachments/assets/7eb57dd5-ca0b-47a4-a467-1621453384bc)

- Secure Firebase authentication  
- Email/password login or simulated biometric login  

### 🏠 Home Page - Event Discovery
![Home](https://github.com/user-attachments/assets/82e498bd-1421-4b50-8430-16bb9e2013c4)

- Browse featured events  
- Search events by **event name or city**  
- Clicking search with no input shows **all default events**  
- View event cards with quick access to details  
- Switch between **English (EN)** and **Arabic (AR)** for localized experience  
![Language Switch](https://github.com/user-attachments/assets/18a2b6ac-6fad-4e1c-a4d1-648a509d9219)

### 📅 Event Details Page
![Details](https://github.com/user-attachments/assets/3159331e-5ea9-4346-9fec-69a96a39b3e8)

- View complete info: date, time, venue, pricing  
- Interactive Google Map location  
- Add/remove favorites  

### 🗺️ Map View
![Map](https://github.com/user-attachments/assets/b17691a4-4677-4d96-bcca-cbcf2d68ab4b)

- Google Maps integration with event location pins  
- Zoom and directions enabled  

### 👤 Profile Page
![Profile](https://github.com/user-attachments/assets/76ae47b2-5d53-4bf9-b120-56bc63ded069)  
![Profile Edit](https://github.com/user-attachments/assets/1a20d7cc-20d2-4d39-9a15-90464bd620d0)

- Edit name and photo URL  
- Manage favorites  
- Enable/disable biometric login  
- Secure logout  

### ❤️ Favorites Management
![Favorites](https://github.com/user-attachments/assets/66a44fc5-47de-439a-9f53-719243eeb073)  
![Favorites List](https://github.com/user-attachments/assets/40c73126-82ed-451e-a634-8c86963c7b14)

- View all saved events  
- Remove favorites easily  
- Favorites synced across sessions  

---

> **Note:**  
> 🔗 [Live Demo](https://city-pulse-m866.onrender.com)  
> This is a **static site**.  
> - If you refresh on an inner page, the page will not be visible.  
> - To reload correctly, go back to the **default URL** and refresh from there.  
