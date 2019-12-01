function getExtFromMimeType(mimetype) {
  const mimes = {
    "image/png": "png",
    "image/jpeg": "jpg"
  };
  return mimes.hasOwnProperty(mimetype) ? mimes[mimetype] : null;
}

module.exports = {
  getExtFromMimeType
};
