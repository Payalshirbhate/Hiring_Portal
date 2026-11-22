import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Cropper from "react-easy-crop";
import {
  Sun, Moon, UserRound, Camera, Save, LockKeyhole,
  Trash2, X, ZoomIn,
} from "lucide-react";
import HRNavbar from "../components/layout/HRNavbar";
import { useTheme } from "../context/ThemeContext.jsx";

const initialPassword = { old_password: "", new_password: "", confirm_password: "" };
const emptyProfile = { username: "", first_name: "", last_name: "", email: "", profile_picture: null };

// Convert the crop coordinates into a real image file before upload.
async function createCroppedFile(sourceUrl, cropPixels) {
  const image = new Image();
  image.src = sourceUrl;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Unable to read the selected image."));
  });

  const canvas = document.createElement("canvas");
  const outputSize = 512;
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image editing is unavailable in this browser.");
  ctx.drawImage(
    image,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, outputSize, outputSize
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not crop image.")), "image/jpeg", 0.9);
  });
  return new File([blob], "hr-profile-cropped.jpg", { type: "image/jpeg" });
}

export default function HRSettings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(emptyProfile);
  const [photo, setPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [password, setPassword] = useState(initialPassword);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Crop editor state. Selecting a file never uploads it immediately.
  const [cropSource, setCropSource] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [applyingCrop, setApplyingCrop] = useState(false);

  const handleError = useCallback((err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem("access");
      sessionStorage.removeItem("refresh");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/hr/login", { replace: true });
      return;
    }
    const detail = err.response?.data;
    const message = detail?.error || detail?.detail || detail?.message ||
      (typeof detail === "object" ? Object.values(detail || {}).flat().join(" ") : null);
    setError(message || err.message || "Something went wrong. Please try again.");
  }, [navigate]);

  useEffect(() => {
    let active = true;
    api.get("/hr/profile/")
      .then(({ data }) => {
        if (active) setProfile({
          username: data.username || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          profile_picture: data.profile_picture || null,
        });
      })
      .catch((err) => { if (active) handleError(err); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [handleError]);

  // Temporary URL for the cropped image displayed on the Settings page.
  const preview = useMemo(() => {
    if (!photo) return null;
    return URL.createObjectURL(photo);
  }, [photo]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Temporary URL for the original image displayed inside the crop editor.
  useEffect(() => {
    return () => { if (cropSource) URL.revokeObjectURL(cropSource); };
  }, [cropSource]);

  const closeCropEditor = () => {
    setCropSource(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // Allow selecting the same file again.
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choose a JPG, PNG or WebP image under 2 MB.");
      return;
    }
    setError("");
    setNotice("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropSource(URL.createObjectURL(file));
  };

  const applyCrop = async () => {
    if (!cropSource || !croppedAreaPixels) {
      setError("Please wait for the image to load before applying the crop.");
      return;
    }
    setApplyingCrop(true);
    setError("");
    try {
      const croppedFile = await createCroppedFile(cropSource, croppedAreaPixels);
      setPhoto(croppedFile);
      setRemovePhoto(false);
      closeCropEditor();
    } catch (err) {
      setError(err.message || "Unable to crop image.");
    } finally {
      setApplyingCrop(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setRemovePhoto(true);
    setNotice("");
    setError("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const form = new FormData();
    form.append("first_name", profile.first_name);
    form.append("last_name", profile.last_name);
    form.append("email", profile.email);
    if (photo) form.append("profile_picture", photo);
    if (removePhoto) form.append("remove_profile_picture", "true");

    try {
      const { data } = await api.patch("/hr/profile/", form);
      setProfile({
        username: data.username || profile.username,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        profile_picture: data.profile_picture || null,
      });
      setPhoto(null);
      setRemovePhoto(false);
      setNotice("Profile updated successfully.");
      window.dispatchEvent(new Event("hr-profile-updated"));
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password.new_password !== password.confirm_password) {
      setError("New passwords do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      await api.post("/hr/change-password/", {
        old_password: password.old_password,
        new_password: password.new_password,
      });
      setPassword(initialPassword);
      setNotice("Password changed successfully. Use your new password next time you log in.");
    } catch (err) {
      handleError(err);
    } finally {
      setChangingPassword(false);
    }
  };

  const fieldClass = "w-full rounded-lg border border-gray-300 dark:border-[#444] bg-white dark:bg-[#191919] text-gray-900 dark:text-white px-3 py-2 outline-none focus:border-yellow-400";
  const cardClass = "bg-white dark:bg-[#232323] rounded-xl border border-gray-200 dark:border-[#363636] p-4 sm:p-5 shadow-sm";

  return (
    <HRNavbar>
      <div className="hr-theme-page min-h-full bg-[#f5f5f5] dark:bg-[#141414] text-gray-900 dark:text-white px-3 py-3 sm:px-5">
        <div className="max-w-5xl mx-auto space-y-4">
          <header>
            <h1 className="text-2xl font-bold mb-1">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your HR account and workspace preferences.</p>
          </header>

          {notice && <p role="status" className="rounded-lg bg-green-50 text-green-800 px-4 py-3">{notice}</p>}
          {error && <p role="alert" className="rounded-lg bg-red-50 text-red-800 px-4 py-3">{error}</p>}

          <section className={cardClass}>
            <h2 className="text-base font-semibold mb-3">Appearance</h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon size={22} /> : <Sun size={22} />}
                <div>
                  <p className="font-medium">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customize your dashboard appearance.</p>
                </div>
              </div>
              <button type="button" onClick={toggleTheme} className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium">
                Switch to {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-2">
              <UserRound size={21} className="text-yellow-500" /> Profile Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Update your details and profile photo.</p>
            {loading ? <p>Loading profile...</p> : (
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-20 w-20 rounded-full bg-yellow-100 dark:bg-[#37301a] flex items-center justify-center overflow-hidden border-2 border-yellow-400">
                    {(preview || (!removePhoto && profile.profile_picture)) ? (
                      <img src={preview || profile.profile_picture} alt="HR profile" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={38} className="text-yellow-600" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 font-medium">
                        <Camera size={17} /> Choose Photo
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={choosePhoto} />
                      </label>
                      {(photo || (!removePhoto && profile.profile_picture)) && (
                        <button type="button" className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400" onClick={handleRemovePhoto}>
                          <Trash2 size={16} /> Remove photo
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or WebP, maximum 2 MB. Crop before saving.</p>
                    {(photo || removePhoto) && <p className="text-xs text-yellow-700 dark:text-yellow-300">Unsaved photo changes — click Save Profile to apply.</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">Username
                    <input value={profile.username} readOnly className={`${fieldClass} mt-1 opacity-70 cursor-not-allowed`} />
                  </label>
                  <label className="block text-sm font-medium">Email
                    <input type="email" required value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className={`${fieldClass} mt-1`} />
                  </label>
                  <label className="block text-sm font-medium">First Name
                    <input value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} className={`${fieldClass} mt-1`} />
                  </label>
                  <label className="block text-sm font-medium">Last Name
                    <input value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} className={`${fieldClass} mt-1`} />
                  </label>
                </div>
                <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black font-medium px-4 py-2">
                  <Save size={17} /> {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <LockKeyhole size={21} className="text-yellow-500" /> Change Password
            </h2>
            <form onSubmit={changePassword} className="space-y-4 max-w-xl">
              <label className="block text-sm font-medium">Current Password
                <input type="password" required autoComplete="current-password" value={password.old_password} onChange={e => setPassword(p => ({ ...p, old_password: e.target.value }))} className={`${fieldClass} mt-1`} />
              </label>
              <label className="block text-sm font-medium">New Password
                <input type="password" required autoComplete="new-password" value={password.new_password} onChange={e => setPassword(p => ({ ...p, new_password: e.target.value }))} className={`${fieldClass} mt-1`} />
              </label>
              <label className="block text-sm font-medium">Confirm New Password
                <input type="password" required autoComplete="new-password" value={password.confirm_password} onChange={e => setPassword(p => ({ ...p, confirm_password: e.target.value }))} className={`${fieldClass} mt-1`} />
              </label>
              <button disabled={changingPassword} className="rounded-lg bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black font-medium px-4 py-2">
                {changingPassword ? "Updating..." : "Change Password"}
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Crop modal: edits only the local image; Save Profile uploads it. */}
      {cropSource && (
        <div className="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="crop-title" className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#232323] text-gray-900 dark:text-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#444]">
              <h2 id="crop-title" className="text-lg font-semibold">Edit Profile Picture</h2>
              <button type="button" onClick={closeCropEditor} aria-label="Close photo editor" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333]">
                <X size={20} />
              </button>
            </div>
            <div className="relative w-full h-[300px] sm:h-[360px] bg-[#111]">
              <Cropper
                image={cropSource}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Drag the photo to reposition it, then adjust the zoom.</p>
              <div className="flex items-center gap-3">
                <ZoomIn size={19} />
                <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Photo zoom" className="w-full accent-yellow-400" />
                <span className="text-sm w-12 text-right">{zoom.toFixed(1)}×</span>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeCropEditor} disabled={applyingCrop} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#555]">Cancel</button>
                <button type="button" onClick={applyCrop} disabled={applyingCrop || !croppedAreaPixels} className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black font-semibold disabled:opacity-50">
                  {applyingCrop ? "Applying..." : "Apply Crop"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </HRNavbar>
  );
}
