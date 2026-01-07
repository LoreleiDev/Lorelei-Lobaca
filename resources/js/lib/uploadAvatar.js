export const uploadToCloudinary = async (file, userId) => {
    if (!file) throw new Error("No file provided");

    const cloudName = "dvwp7mgic"; 
    const uploadPreset = "Lobaca Avatar"; 

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", `avatars/${userId}`);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary upload error:", errorText);
        throw new Error("Gagal upload ke Cloudinary");
    }

    const data = await response.json();
    return data.secure_url; 
};
