const fs = require("fs");
const path = require("path");

const projectDirectory = "../pd-website-SSR/src/";
const localesDirectory = "../pd-website-SSR/static/locales/";
// Substitua 'seu_projeto' pelo caminho do diretório do seu projeto.
const importedFiles = new Set();
const allJSFiles = new Set();
const allLocales = new Set();
const unimportedFiles = [];
const fileAndKey = new Set();

// Função para percorrer todos os arquivos no diretório do projeto
function checkProjectForJSFiles(directory) {
  fs.readdirSync(directory).forEach((file) => {
    const filePath = path.join(directory, file);
    if (fs.statSync(filePath).isDirectory()) {
      checkProjectForJSFiles(filePath);
    } else if ([".js", ".jsx"].includes(path.extname(file))) {
      allJSFiles.add(filePath);
    }
  });
}

// Função para percorrer todos os arquivos no diretório do projeto
function getLocalesFile(directory) {
  fs.readdirSync(directory).forEach((file) => {
    const filePath = path.join(directory, file);
    if (fs.statSync(filePath).isDirectory()) {
      getLocalesFile(filePath);
    } else if ([".json"].includes(path.extname(file))) {
      if (filePath.includes(".test")) return;
      if (filePath.includes(".stories")) return;
      allLocales.add(filePath);
    }
  });
}

const getFileName = (path) => {
  return path
    .split("\\")
    .pop()
    .split("/")
    .pop()
    .replace(".jsx", "")
    .replace(".js", "");
};

const hasLocaleKey = (path, key) => {
  const fileContent = fs.readFileSync(path, "utf8");
  const hasMatch = fileContent.match(key);
  return hasMatch;
};

// Função para percorrer os arquivos e registrar importações
function processFile(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");

  const importStatements =
    fileContent.match(/import\s+.*\s+from\s+['"](.*)['"]/g) || [];

  let importedFile = [];
  importStatements.forEach((importStatement) => {
    const imported = importStatement.match(/['"](.*?)['"]/)[1];
    importedFile = [
      ...importedFile,
      path.resolve(path.dirname(filePath), imported),
    ];
  });

  importedFiles.add({
    fileName: getFileName(filePath),
    import: importedFile,
  });
}

function readJsonFile(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContent);
}

// Inicie a verificação no diretório do projeto
checkProjectForJSFiles(projectDirectory);


//const fileName = "SubjectTabLists";
// Encontrar arquivos não importados
allJSFiles.forEach((file) => {
  const fileName = getFileName(file);
  if (
    ![...importedFiles.values()].some(
      (e) =>
        e.fileName !== fileName && e.import.some((x) => x.includes(fileName))
    )
  ) {
    unimportedFiles.push(fileName);
  }
});

getLocalesFile(localesDirectory);

allLocales.forEach((file) => {
  for (const [key] of Object.entries(readJsonFile(file))) {
    fileAndKey.add({
      file: file,
      key: key,
    });
  }
});

const isUsedKey = (key) => {
  for (const file of allJSFiles) {
    if (hasLocaleKey(file, key)) {
      return true;
    }
  }
  return false;
};

console.log("Locales não utilizados em lugar nenhum:");
fileAndKey.forEach(({ file, key }) => {
  if (!isUsedKey(key)) {
    console.log(file, key);
  }
});
