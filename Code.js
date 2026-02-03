var MAX_SIZE = 1024 * 1024 * 1024; // 1 GB

function doGet() {
  return HtmlService.createHtmlOutputFromFile("index");
}

// ===== FOLDER SYSTEM =====

function getRootUsersFolder() {
  var root = DriveApp.getFoldersByName("Mini_Cloud_Server");
  if (!root.hasNext()) throw "Mini_Cloud_Server folder not found";

  var rootFolder = root.next();
  var users = rootFolder.getFoldersByName("Users");
  if (!users.hasNext()) throw "Users folder not found";

  return users.next();
}

function getUserFolder(email) {
  var usersRoot = getRootUsersFolder();
  var folders = usersRoot.getFoldersByName(email);

  if (!folders.hasNext()) {
    return usersRoot.createFolder(email);
  }
  return folders.next();
}

// ===== STORAGE =====

function getFolderSize(folder) {
  var total = 0;
  var files = folder.getFiles();
  while (files.hasNext()) {
    total += files.next().getSize();
  }
  return total;
}

// ===== AUTH =====

function signup(email, password) {
  if (!email || !password) return "Email and password required";

  var props = PropertiesService.getScriptProperties();

  if (props.getProperty(email) !== null) {
    return "User already exists";
  }

  props.setProperty(email, password);
  getUserFolder(email); // auto create folder

  return "Account created successfully";
}

function login(email, password) {
  if (!email || !password) return "Email and password required";

  var props = PropertiesService.getScriptProperties();
  var saved = props.getProperty(email);

  if (saved === null) return "User not found";
  if (saved !== password) return "Wrong password";

  return "Login success";
}

// ===== FILE OPS =====

function uploadFile(email, base64Data, fileName) {
  if (!email || !base64Data || !fileName) return "Missing data";

  var folder = getUserFolder(email);
  var used = getFolderSize(folder);
  var bytes = Utilities.base64Decode(base64Data).length;

  if (used + bytes > MAX_SIZE) {
    return "Storage full (1GB limit)";
  }

  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), null, fileName);
  folder.createFile(blob);

  return "File uploaded successfully";
}

function listFiles(email) {
  var folder = getUserFolder(email);
  var files = folder.getFiles();
  var result = [];

  while (files.hasNext()) {
    var f = files.next();
    result.push({
      name: f.getName(),
      size: (f.getSize() / (1024 * 1024)).toFixed(2)
    });
  }
  return result;
}

function deleteFile(email, fileName) {
  var folder = getUserFolder(email);
  var files = folder.getFilesByName(fileName);

  if (files.hasNext()) {
    files.next().setTrashed(true);
    return "File deleted successfully";
  }
  return "File not found";
}

function getUsage(email) {
  var folder = getUserFolder(email);
  var used = getFolderSize(folder);
  var usedMB = (used / (1024 * 1024)).toFixed(2);
  var remaining = (1024 - usedMB).toFixed(2);

  return {
    used: usedMB,
    remaining: remaining
  };
}

// ===== LINKS =====

function getUserFolderLink(email) {
  return getUserFolder(email).getUrl();
}

function getFileUrl(email, fileName) {
  var folder = getUserFolder(email);
  var files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    return files.next().getUrl();
  }
  return null;
}

function getFileDownloadUrl(email, fileName) {
  var folder = getUserFolder(email);
  var files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    var file = files.next();
    return "https://drive.google.com/uc?export=download&id=" + file.getId();
  }
  return null;
}