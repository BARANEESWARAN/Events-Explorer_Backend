const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (Object.keys(serviceAccount).length === 0) {
  console.error("FIREBASE_SERVICE_ACCOUNT environment variable is required");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const usersCollection = db.collection("webauthnUsers");

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const RP_ID = process.env.RP_ID || "localhost";
const RP_NAME = process.env.RP_NAME || "City Pulse";
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.options('*', cors());

function stringToUint8Array(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

async function getUserByEmail(email) {
  try {
    const snapshot = await usersCollection.where("email", "==", email).get();
    if (snapshot.empty) {
      console.log(`No user found with email: ${email}`);
      return null;
    }
    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

async function getUserById(id) {
  try {
    const doc = await usersCollection.doc(id).get();
    if (!doc.exists) {
      console.log(`No user found with ID: ${id}`);
      return null;
    }
    return doc.data();
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

async function createUser(id, email, passKey, firebaseUid) {
  try {
    await usersCollection.doc(id).set({
      id,
      email,
      passKey,
      firebaseUid,
      createdAt: new Date()
    });
    console.log(`Created WebAuthn user for email: ${email}`);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

async function updateUserCounter(id, counter) {
  try {
    await usersCollection.doc(id).update({
      "passKey.counter": counter
    });
  } catch (error) {
    console.error("Error updating user counter:", error);
    throw error;
  }
}

async function getUserByEmailWithCredentials(email) {
  try {
    console.log(`Looking for WebAuthn credentials for email: ${email}`);
    const snapshot = await usersCollection.where("email", "==", email).get();
    
    if (snapshot.empty) {
      console.log(`No WebAuthn user found for email: ${email}`);
      return null;
    }
    
    const userData = snapshot.docs[0].data();
    
    if (userData.passKey) {
      console.log(`User has WebAuthn credentials`);
      return userData;
    } else {
      console.log(`User exists but has no WebAuthn credentials`);
      return null;
    }
  } catch (error) {
    console.error("Error getting user with credentials:", error);
    return null;
  }
}

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get("/debug-users", async (req, res) => {
  try {
    const snapshot = await usersCollection.get();
    const users = [];
    snapshot.forEach(doc => {
      users.push(doc.data());
    });
    res.json({ users, count: users.length });
  } catch (error) {
    console.error("Debug users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

app.get("/debug-firebase-user", async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    res.json({ 
      exists: true, 
      uid: user.uid, 
      email: user.email,
      displayName: user.displayName 
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      res.json({ exists: false, email });
    } else {
      console.error("Firebase debug error:", error);
      res.status(500).json({ error: "Failed to check Firebase user" });
    }
  }
});

app.get("/debug-cookies", (req, res) => {
  res.json({ cookies: req.cookies, headers: req.headers });
});

app.get("/test-cookie", (req, res) => {
  res.cookie("testCookie", "testValue", {
    httpOnly: true,
    maxAge: 300000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: "Test cookie set" });
});

app.get("/init-register", async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    console.log(`Registration initiated for email: ${email}`);
    
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
      console.log(`Firebase user found: ${firebaseUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`No Firebase user with email: ${email}`);
        return res.status(400).json({ error: "No user with this email. Please sign up first." });
      }
      console.error("Firebase error:", error);
      return res.status(500).json({ error: "Failed to verify user" });
    }

    const existingUser = await getUserByEmailWithCredentials(email);
    if (existingUser != null) {
      console.log(`User already has WebAuthn credentials: ${email}`);
      return res.status(400).json({ error: "User already has biometric credentials. Please use biometric login instead." });
    }

    const userId = uuidv4();
    console.log(`Generating registration options for new user ID: ${userId}`);

    const userIDBuffer = stringToUint8Array(userId);

    const options = await generateRegistrationOptions({
      rpID: RP_ID,
      rpName: RP_NAME,
      userName: email,
      userDisplayName: email,
      userID: userIDBuffer,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "discouraged",
        requireResidentKey: false
      },
    });

    res.cookie(
      "regInfo",
      JSON.stringify({
        userId: userId,
        email,
        firebaseUid: firebaseUser.uid,
        challenge: options.challenge,
      }),
      { 
        httpOnly: true, 
        maxAge: 5 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      }
    );

    console.log(`Registration options generated successfully for: ${email}`);
    res.json(options);
  } catch (error) {
    console.error("Registration options error:", error);
    res.status(500).json({ error: "Failed to generate registration options" });
  }
});

app.post("/verify-register", async (req, res) => {
  try {
    console.log("Cookies received:", req.cookies);
    console.log("Registration verification request body:", JSON.stringify(req.body, null, 2));
    
    const regInfo = req.cookies.regInfo ? JSON.parse(req.cookies.regInfo) : {};
    console.log("Parsed regInfo:", regInfo);

    if (!regInfo.challenge) {
      console.log("No challenge found in regInfo cookie");
      return res.status(400).json({ error: "Registration session expired. Please try again." });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: regInfo.challenge,
      expectedOrigin: CLIENT_URL,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });

    if (verification.verified && verification.registrationInfo) {
      console.log("Registration verified, creating user...");
      
      await createUser(regInfo.userId, regInfo.email, {
        id: verification.registrationInfo.credentialID,
        publicKey: verification.registrationInfo.credentialPublicKey,
        counter: verification.registrationInfo.counter,
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
        transports: req.body.response.transports || ['internal'],
      }, regInfo.firebaseUid);
      
      res.clearCookie("regInfo");
      console.log(`User ${regInfo.email} registered successfully with WebAuthn`);
      
      return res.json({ 
        verified: verification.verified,
        userId: regInfo.userId,
        email: regInfo.email
      });
    } else {
      console.log("Registration verification failed");
      return res.status(400).json({ 
        verified: false, 
        error: "Biometric registration failed. Please make sure to complete the biometric verification." 
      });
    }
  } catch (error) {
    console.error("Registration verification error:", error);
    
    if (error.message.includes('user verification')) {
      return res.status(400).json({ 
        error: "Biometric verification failed. Please try again and make sure to complete the fingerprint/face recognition." 
      });
    }
    
    return res.status(400).json({ error: error.message });
  }
});

app.get("/init-auth", async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    console.log(`Authentication initiated for email: ${email}`);
    
    try {
      const firebaseUser = await admin.auth().getUserByEmail(email);
      console.log(`Firebase user verified: ${firebaseUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`No Firebase user with email: ${email}`);
        return res.status(400).json({ error: "No user with this email. Please sign up first." });
      }
      console.error("Firebase error:", error);
      return res.status(500).json({ error: "Failed to verify user" });
    }

    const user = await getUserByEmailWithCredentials(email);
    if (user == null) {
      console.log(`No WebAuthn credentials found for: ${email}`);
      return res.status(400).json({ 
        error: "No biometric credentials found for this email. Please register your biometrics first.",
        needsRegistration: true
      });
    }

    console.log(`Found WebAuthn user: ${user.id}`);
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: [
        {
          id: user.passKey.id,
          type: "public-key",
          transports: user.passKey.transports,
        },
      ],
      userVerification: "discouraged",
    });

    res.cookie(
      "authInfo",
      JSON.stringify({
        userId: user.id,
        email: user.email,
        challenge: options.challenge,
      }),
      { 
        httpOnly: true, 
        maxAge: 5 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      }
    );

    console.log(`Authentication options generated for: ${email}`);
    res.json(options);
  } catch (error) {
    console.error("Authentication options error:", error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(400).json({ error: "No user with this email" });
    }
    
    res.status(500).json({ error: "Failed to generate authentication options" });
  }
});

app.post("/verify-auth", async (req, res) => {
  try {
    const authInfo = JSON.parse(req.cookies.authInfo || '{}');
    console.log("Verifying authentication with info:", authInfo);

    if (!authInfo.challenge) {
      return res.status(400).json({ error: "Authentication session expired. Please try again." });
    }

    const user = await getUserById(authInfo.userId);
    if (user == null) {
      return res.status(400).json({ error: "Invalid user session" });
    }

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: authInfo.challenge,
      expectedOrigin: CLIENT_URL,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: user.passKey.id,
        credentialPublicKey: user.passKey.publicKey,
        counter: user.passKey.counter,
        transports: user.passKey.transports,
      },
      requireUserVerification: false,
    });

    if (verification.verified) {
      await updateUserCounter(user.id, verification.authenticationInfo.newCounter);
      res.clearCookie("authInfo");
      console.log(`Authentication successful for: ${user.email}`);
      
      return res.json({ 
        verified: verification.verified,
        userId: user.id,
        email: user.email,
        firebaseUid: user.firebaseUid,
        displayName: user.email.split('@')[0]
      });
    } else {
      console.log("Authentication verification failed");
      return res.status(400).json({ verified: false, error: "Biometric authentication failed" });
    }
  } catch (error) {
    console.error("Authentication verification error:", error);
    return res.status(400).json({ error: error.message });
  }
});

app.get("/biometric-status", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    const user = await getUserByEmailWithCredentials(email);
    
    res.json({ 
      hasBiometric: user !== null,
      email: email
    });
  } catch (error) {
    console.error("Biometric status error:", error);
    res.status(500).json({ error: "Failed to get biometric status" });
  }
});

app.delete("/biometric-credentials", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    const user = await getUserByEmail(email);
    if (user) {
      await usersCollection.doc(user.id).delete();
      res.json({ success: true, message: "Biometric credentials removed" });
    } else {
      res.status(404).json({ error: "No biometric credentials found" });
    }
  } catch (error) {
    console.error("Remove credentials error:", error);
    res.status(500).json({ error: "Failed to remove biometric credentials" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS allowed origin: ${CLIENT_URL}`);
});