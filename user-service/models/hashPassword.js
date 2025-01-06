const bcrypt = require('bcryptjs');

// Password you want to hash
const password = '1234567890';

// Generate salt and hash the password
bcrypt.genSalt(10, (err, salt) => {
    if (err) throw err;
    bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw err;
        console.log('Hashed Password:', hash);
    });
});
