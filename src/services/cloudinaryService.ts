import cloudinary from "cloudinary";

export const uploadImage = async (imagePath, folder) => {
  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    folder: folder,
  };

  try {
    const result = await (cloudinary as any).v2.uploader.upload(
      imagePath,
      options
    );
    return `${result.public_id}.${result.format}`;
  } catch (error) {
    console.error(error);
  }
};

export const deleteImage = async (imagePath) => {
  const finaleName =
    imagePath.substr(0, imagePath.lastIndexOf(".")) || imagePath;

  try {
    const result = await (cloudinary as any).v2.uploader.destroy(finaleName);
    return result;
  } catch (error) {
    console.error(error);
  }
};
