const errHandler = (err, req, res, next) => {
  switch (err.name) {
    case "EmailRequired":
      res.status(400).json({ message: "Email is required" });
      break;
    case "PassRequired":
      res.status(400).json({ message: "Password is required" });
      break;
    case "FullNameRequired":
      res.status(400).json({ message: "Full name is required" });
      break;
    case "UsernameRequired":
      res.status(400).json({ message: "Username is required" });
      break;
    case "PreferRequired":
      res.status(400).json({ message: "Preference is required" });
      break;
    case "ImageUrlRequired":
      res.status(400).json({ message: "Image URL is required" });
      break;
    case "DescriptionRequired":
      res.status(400).json({ message: "Description is required" });
      break;
    case "FormatEmail":
      res
        .status(400)
        .json({ message: "Email must be formatted (example@gmail.com)" });
      break;
    case "ExistEmail":
      res.status(400).json({ message: "Email already exists" });
      break;
    case "InvalidLogin":
      res.status(401).json({ message: "Invalid Email/Password" });
      break;
    case "NotFound":
      res.status(404).json({ message: "Data not found" });
      break;
    case "InvalidToken":
    case "JsonWebTokenError":
      res.status(401).json({ message: "Invalid Token" });
      break;
    default:
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
      break;
  }
};

module.exports = { errHandler };
