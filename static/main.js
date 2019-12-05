let files = [];
let errStatus = null;
let response = [];
const STATUS = {
  PENDING: "pending",
  OK: "ok"
};
let { files_list } = window;
function dragOverHandler(ev) {
  console.log("File(s) in drop zone");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}
function dropHandler(ev) {
  console.log("File(s) dropped");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items && ev.dataTransfer.items.length) {
    files = files.concat(
      Array.prototype.filter
        .call(ev.dataTransfer.items, item => item.kind === "file")
        .map(item => item.getAsFile())
    );
    console.dir(files);
    renderFiles(files);
  }
}
function renderFiles(files) {
  files_list.innerHTML = files
    .map(file => `<p class='status--${file.status}'>${file.name}</p>\n`)
    .join("");
}
function handleClickUpload() {
  handleFiles(files);
}
function setStatusOK(index) {
  files = files.map((file, i) => {
    file.status = index === i ? STATUS.OK : file.status;
    return file;
  });
  renderFiles(files);
}
function setStatusPending(index) {
  files = files.map((file, i) => {
    file.status = index === i ? STATUS.PENDING : file.status;
    return file;
  });
  renderFiles(files);
}
async function handleFiles(files) {
  const fns = [...files].map(uploadFile(setStatusOK));
  for await (fn of fns) {
    const result = await fn();
    response.push(result);
  }
}
function uploadFile(cb) {
  return function(file, index) {
    return function() {
      setStatusPending(index);
      let url = "/file-upload";
      let formData = new FormData();
      formData.append("file", file);
      return fetch(url, {
        method: "POST",
        body: formData
      })
        .then(res => {
          cb(index);
          return res.json();
        })
        .catch(err => console.log(err));
    };
  };
}
function handleClickDownloadAll() {
  if (response.length) {
    let url = "/file-download";
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(response)
    })
      .then(response => response.blob())
      .then(blob => {
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "all.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => console.log(err));
  }
}
