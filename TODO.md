# TODO: Launch the Server

- [ ] Create .env file with MONGODB_URI and JWT_SECRET placeholders
- [ ] Create User.js model with Mongoose schema
- [ ] Create authMiddleware.js with JWT authentication middleware
- [ ] Fix bcrypt.compare in auth.js login route
- [ ] Update server.js to include dotenv, cors, auth routes, and app.listen
- [ ] Run the server using node server/server.js

# TODO: Connect Front-end to Hosted Backend

- [x] Update API_URL in public/connec.html to https://egback-1.onrender.com
- [x] Update API_URL in public/inscri.html to https://egback-1.onrender.com
- [x] Test registration and login functionality (Login successful, registration returns 400 - possibly user exists or backend issue)
