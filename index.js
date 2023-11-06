const fs = require("fs");
const path = require("path");

const projectDirectory = "../pd-website-SSR/src/"; // Substitua 'seu_projeto' pelo caminho do diretório do seu projeto.
const importedFiles = new Set();
const allJSFiles = new Set();
const unimportedFiles = [];

// Função para percorrer todos os arquivos no diretório do projeto
function checkProjectForJSFiles(directory) {
  fs.readdirSync(directory).forEach((file) => {
    const filePath = path.join(directory, file);
    if (fs.statSync(filePath).isDirectory()) {
      checkProjectForJSFiles(filePath);
    } else if ([".js", ".jsx"].includes(path.extname(file))) {
      if (filePath.includes(".test")) return;
      if (filePath.includes(".stories")) return;
      allJSFiles.add(filePath);
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

// Inicie a verificação no diretório do projeto
checkProjectForJSFiles(projectDirectory);

// Processar todos os arquivos para coletar importações
allJSFiles.forEach((file) => {
  processFile(file);
});
//const fileName = "SubjectTabLists";
// Encontrar arquivos não importados
allJSFiles.forEach((file) => {
  const fileName = getFileName(file);
  if(file.includes("pages")) return;
  if (
    ![...importedFiles.values()].some(
      (e) =>
        e.fileName !== fileName && e.import.some((x) => x.includes(fileName))
    )
  ) {
    unimportedFiles.push(fileName);
  }
});

// Exibir os resultados
console.log("Arquivos não importados em lugar nenhum:");
unimportedFiles.forEach((file) => {
  if (!(file.includes("[") || file.includes("0"))) console.log(file);
});
