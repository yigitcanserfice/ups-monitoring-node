const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

//Register işlemleri

exports.register = (req, res) => {
  console.log(req.body);

  const { username, email, password, confirmPassword } = req.body;

  db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
    async (eror, results) => {
      if (eror) {
        console.log(eror);
      }
      if (results.length > 0) {
        return res.render("register", {
          message: "That email is alreay in use!",
        });
      } else if (password !== confirmPassword) {
        return res.render("register", {
          message: "Passwords do not match!",
        });
      }
      let hashedPassword = await bcrypt.hash(password, 8);
      console.log(hashedPassword);

      db.query(
        "INSERT INTO users SET ?",
        {
          username: username,
          email: email,
          password: hashedPassword,
        },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            console.log(results);
            return res.render("register", {
              message: "User registered",
            });
          }
        }
      );
    }
  );
};

// Login islemleri
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }
      if (
        results.length === 0 ||
        !(await bcrypt.compare(password, results[0].password))
      ) {
        return res.render("login", {
          message: "E-posta veya şifre hatalı!",
        });
      } else {
        // Oturum oluştur
        req.session.userId = results[0].user_id; // id yerine user_id
        req.session.username = results[0].username;
        req.session.email = results[0].email; // E-postayı oturuma kaydet
        req.session.role = results[0].role; // Rolü oturuma kaydet

        // Giriş başarılıysa profile sayfasına yönlendir
        return res.redirect("/");
      }
    }
  );
};

// Logout işlemi
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.redirect("/profile"); // Hata durumunda profile sayfasına yönlendir
    }
    res.redirect("/login"); // Başarılı logout sonrası login sayfasına yönlendir
  });
};
//update

exports.update = async (req, res) => {
  const { username, email, password } = req.body;

  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 8);
  }

  const updateUserQuery = `UPDATE users SET username = ?, email = ?${
    password ? ", password = ?" : ""
  } WHERE user_id = ?`;

  const queryParams = [username, email];
  if (password) {
    queryParams.push(hashedPassword);
  }
  queryParams.push(req.session.userId);

  db.query(updateUserQuery, queryParams, (error, results) => {
    if (error) {
      console.log("Hata:", error); // Hata mesajını daha detaylı yazdırın
      return res.render("profile", {
        message:
          "Bilgiler güncellenirken bir hata oluştu. Detay: " + error.message,
        username: req.session.username,
        email: req.session.email,
      });
    } else {
      req.session.username = username;
      return res.render("profile", {
        message: "Bilgiler başarıyla güncellendi!",
        username: req.session.username,
        email: email,
      });
    }
  });
};
