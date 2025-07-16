export const getImageUrl = (filename, baseUrl = "") => {
  if (!filename) return null;
  
  // Nếu filename đã là full URL thì return nguyên
  if (filename.startsWith("http") || filename.startsWith("/img/")) {
    return filename;
  }
  
  // Nếu không thì tạo URL
  return `/img/${filename}`;
};

export const getProductImageUrls = (images = []) => {
  return images.map(img => getImageUrl(img));
};