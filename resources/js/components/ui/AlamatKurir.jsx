import { useState, useEffect } from "react";
import { ChevronRight, AlertCircle, Loader2, Search, MapPin, Truck, Package, CheckCircle, Home, Building, Info, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import Loading from "./Loading";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

const FIXED_ORIGIN_ID = "5896";

export default function AlamatKurirPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("address");
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);
  const [selection, setSelection] = useState({
    province: null,
    city: null,
    district: null,
    subDistrict: null,
  });
  const [cartWeight, setCartWeight] = useState(0);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [detailAlamat, setDetailAlamat] = useState({
    rt: "",
    rw: "",
    gang: "",
    nomor_rumah: "",
    keterangan: ""
  });

  const handleCheckShipping = async () => {
    if (!selection.subDistrict) {
      Toast.fire({ icon: "warning", title: "Pilih kelurahan terlebih dahulu." });
      return;
    }
    const districtId = selection.district?.id;
    if (!districtId) {
      Toast.fire({ icon: "warning", title: "Kecamatan tujuan tidak valid." });
      return;
    }
    const subDistrictId = selection.subDistrict?.id;
    if (!subDistrictId) {
      Toast.fire({ icon: "warning", title: "Kelurahan tujuan tidak valid." });
      return;
    }
    const destinationDistrictId = String(subDistrictId);
    if (!cartWeight || cartWeight <= 0) {
      Toast.fire({ icon: "warning", title: "Berat keranjang tidak valid." });
      return;
    }

    setLoading(true);
    setError("");
    setStep("results");

    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch("/api/rajaongkir/calculate-shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin: FIXED_ORIGIN_ID,
          destination: destinationDistrictId,
          weight: cartWeight,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMessage = "Gagal menghitung ongkir.";
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || json.message || errorMessage;
        } catch (parseError) {
          throw new Error("Server mengembalikan halaman HTML, bukan JSON.");
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {

        const flattened = [];
        for (let res of data.results) {
          for (let service of res.services) {
            flattened.push({
              ...service,
              courier: res.courier,
              courier_code: res.courier_code,

            });
          }
        }
        setAllServices(flattened);
      } else {
        throw new Error("Respons tidak mengandung data ongkir.");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menghitung ongkir.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCartWeight = async () => {
      const token = localStorage.getItem('user_token');
      if (!token) {
        Toast.fire({ icon: "error", title: "Token tidak ditemukan." });
        navigate('/login');
        return;
      }
      try {
        const res = await fetch("/api/cart", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.data.items || [];
          const totalWeight = items.reduce((total, item) => {
            const itemWeight = (item.buku.berat || 500) * item.jumlah;
            return total + itemWeight;
          }, 0);
          setCartWeight(totalWeight);
          setStep("address");
        } else {
          Toast.fire({ icon: "error", title: "Gagal mengambil data keranjang." });
        }
      } catch (error) {
        Toast.fire({ icon: "error", title: "Kesalahan jaringan saat mengambil berat." });
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchCartWeight();
  }, [navigate]);

  useEffect(() => {
    if (step !== "address") return;
    const fetchProvinces = async () => {
      const token = localStorage.getItem('user_token');
      if (!token) return;
      try {
        const res = await fetch("/api/rajaongkir/provinces", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProvinces(data.data || []);
        } else {
          Toast.fire({ icon: "error", title: "Gagal mengambil provinsi." });
        }
      } catch (err) {
        Toast.fire({ icon: "error", title: "Kesalahan jaringan." });
      }
    };
    fetchProvinces();
  }, [step]);

  useEffect(() => {
    if (step !== "results" || loading) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allServices.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allServices.length) % allServices.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm(allServices[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, selectedIndex, loading, allServices]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 1 || !selection.province) {
        if (selection.province) {
          let allItems = [];
          if (!selection.city) {
            allItems = cities;
          } else if (!selection.district) {
            allItems = districts;
          } else if (!selection.subDistrict) {
            allItems = subDistricts;
          }
        } else {
        }
        return;
      }
      setIsSearching(true);
      try {
        const token = localStorage.getItem('user_token');
        let endpoint = "";
        if (!selection.city) {
          endpoint = `/api/rajaongkir/cities/${selection.province.id}`;
        } else if (!selection.district) {
          endpoint = `/api/rajaongkir/districts/${selection.city.id}`;
        } else if (!selection.subDistrict) {
          endpoint = `/api/rajaongkir/sub-districts/${selection.district.id}`;
        } else {
          return;
        }
        const res = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const items = data.data || [];
        const filtered = items
          .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((item) => ({ ...item, type: "suggestion", displayName: item.name }));
      } catch (err) {
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selection.province, selection.city, selection.district, selection.subDistrict, cities, districts, subDistricts]);


  const handleSelectProvince = async (prov) => {
    setSelection({ province: prov, city: null, district: null, subDistrict: null });
    setSearchQuery("");
    setCities([]);
    setDistricts([]);
    setSubDistricts([]);
    setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch(`/api/rajaongkir/cities/${prov.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCities(data.data || []);
    } catch (err) {
      Toast.fire({ icon: "error", title: "Gagal mengambil kota." });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = async (city) => {
    setSelection(prev => ({ ...prev, city, district: null, subDistrict: null }));
    setSearchQuery("");
    setDistricts([]);
    setSubDistricts([]);
    setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch(`/api/rajaongkir/districts/${city.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDistricts(data.data || []);
    } catch (err) {
      Toast.fire({ icon: "error", title: "Gagal mengambil kecamatan." });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDistrict = async (dist) => {
    setSelection(prev => ({ ...prev, district: dist, subDistrict: null }));
    setSearchQuery("");
    setSubDistricts([]);
    setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch(`/api/rajaongkir/sub-districts/${dist.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubDistricts(data.data || []);
    } catch (err) {
      Toast.fire({ icon: "error", title: "Gagal mengambil kelurahan." });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubDistrict = (sub) => {
    setSelection(prev => ({ ...prev, subDistrict: sub }));
    setSearchQuery("");
    setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
  };

  const handleConfirm = (selectedService) => {
    if (!selection.subDistrict || !selectedService) {
      Toast.fire({ icon: "warning", title: "Pilih alamat dan pastikan hasil tersedia." });
      return;
    }
    const fullAddress = `${selection.subDistrict.name}, ${selection.district.name}, ${selection.city.name}, ${selection.province.name}`;
    const detailRT = detailAlamat.rt ? `RT ${detailAlamat.rt}` : "";
    const detailRW = detailAlamat.rw ? `RW ${detailAlamat.rw}` : "";
    const detailGang = detailAlamat.gang ? detailAlamat.gang : "";
    const detailNomor = detailAlamat.nomor_rumah ? `No. ${detailAlamat.nomor_rumah}` : "";
    const detailKeterangan = detailAlamat.keterangan ? `(${detailAlamat.keterangan})` : "";

    const alamatLengkap = [
      [detailNomor, detailGang].filter(Boolean).join(" "),
      [detailRT, detailRW].filter(Boolean).join("/"),
      fullAddress,
      detailKeterangan
    ].filter(Boolean).join(", ");

    localStorage.setItem('alamat_lengkap', alamatLengkap);
    localStorage.setItem('shipping_cost', selectedService.cost.toString());
    localStorage.setItem('selected_courier_code', selectedService.courier_code);
    localStorage.setItem('selected_courier_name', selectedService.courier);
    localStorage.setItem('destination_district_id', selection.district.id);

    Toast.fire({ icon: "success", title: "Alamat & Kurir disimpan!" });
    setTimeout(() => {
      navigate('/cart');
    }, 1500);
  };

  const formatWeight = (grams) => {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)} kg`;
    }
    return `${grams} gram`;
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (step === "address" && provinces.length === 0 && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Tombol Kembali */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium cursor-pointer">Kembali</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-gray-800 p-2.5 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Atur Alamat & Pengiriman</h1>
              <p className="text-gray-600 text-sm mt-1">Pilih lokasi tujuan dan layanan kurir</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
            step === "address" ? "bg-gray-800 text-white" : "bg-white text-gray-600 border border-gray-300"
          )}>
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Alamat</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
            step === "results" ? "bg-gray-800 text-white" : "bg-white text-gray-600 border border-gray-300"
          )}>
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">Pilih Kurir</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {step === "address" && (
              <div className="space-y-6">
                {/* Address Selection Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-50 p-2 rounded-md">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Lokasi Pengiriman</h2>
                  </div>

                  {/* Selected Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selection.province && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm border border-gray-300">
                        {selection.province.name}
                        <button
                          onClick={() => {
                            setSelection({ province: null, city: null, district: null, subDistrict: null });
                            setCities([]);
                            setDistricts([]);
                            setSubDistricts([]);
                            setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                          }}
                          className="ml-1 text-gray-500 hover:text-red-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selection.city && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm border border-gray-300">
                        {selection.city.name}
                        <button
                          onClick={() => {
                            setSelection(prev => ({ ...prev, city: null, district: null, subDistrict: null }));
                            setDistricts([]);
                            setSubDistricts([]);
                            setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                          }}
                          className="ml-1 text-gray-500 hover:text-red-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selection.district && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm border border-gray-300">
                        {selection.district.name}
                        <button
                          onClick={() => {
                            setSelection(prev => ({ ...prev, district: null, subDistrict: null }));
                            setSubDistricts([]);
                            setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                          }}
                          className="ml-1 text-gray-500 hover:text-red-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selection.subDistrict && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200">
                        {selection.subDistrict.name}
                        <button
                          onClick={() => {
                            setSelection(prev => ({ ...prev, subDistrict: null }));
                            setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                          }}
                          className="ml-1 text-blue-500 hover:text-red-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>

                  {/* Search Input */}
                  {!selection.subDistrict && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cari {!selection.province ? "Provinsi" : !selection.city ? "Kota/Kabupaten" : !selection.district ? "Kecamatan" : "Kelurahan/Desa"}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Ketik untuk mencari..."
                          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                        )}
                      </div>

                      {/* Search Results */}
                      <div className="mt-3 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                        {(searchQuery.length > 0 ?
                          ((!selection.province ? provinces : !selection.city ? cities : !selection.district ? districts : subDistricts)
                            .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())))
                          :
                          (selection.province && !selection.subDistrict ? (!selection.city ? cities : !selection.district ? districts : subDistricts) : [])
                        )
                          .slice(0, 20)
                          .map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                if (!selection.province) handleSelectProvince(item);
                                else if (!selection.city) handleSelectCity(item);
                                else if (!selection.district) handleSelectDistrict(item);
                                else handleSelectSubDistrict(item);
                              }}
                              className="cursor-pointer w-full text-left px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-md transition-colors flex justify-between items-center group"
                            >
                              <span className="text-gray-700">{item.name}</span>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Detail Alamat Tambahan */}
                  {selection.subDistrict && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-50 p-2 rounded-md">
                          <Home className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-md font-semibold text-gray-800">Detail Alamat</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
                          <input
                            type="text"
                            value={detailAlamat.rt}
                            onChange={(e) => setDetailAlamat(prev => ({ ...prev, rt: e.target.value }))}
                            placeholder="Contoh: 001"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
                          <input
                            type="text"
                            value={detailAlamat.rw}
                            onChange={(e) => setDetailAlamat(prev => ({ ...prev, rw: e.target.value }))}
                            placeholder="Contoh: 003"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jalan / Komplek</label>
                          <input
                            type="text"
                            value={detailAlamat.gang}
                            onChange={(e) => setDetailAlamat(prev => ({ ...prev, gang: e.target.value }))}
                            placeholder="Contoh: Jl. Mawar 2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rumah</label>
                          <input
                            type="text"
                            value={detailAlamat.nomor_rumah}
                            onChange={(e) => setDetailAlamat(prev => ({ ...prev, nomor_rumah: e.target.value }))}
                            placeholder="Contoh: 123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Tambahan</label>
                          <textarea
                            value={detailAlamat.keterangan}
                            onChange={(e) => setDetailAlamat(prev => ({ ...prev, keterangan: e.target.value }))}
                            placeholder="Contoh: Belakang pasar, dekat warung, patokan tertentu"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent resize-none min-h-20"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selection.subDistrict && (
                    <div className="mt-8 space-y-3">
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                        <p className="text-sm text-gray-600 mb-1">Alamat terpilih:</p>
                        <p className="text-base font-medium text-gray-800">
                          {selection.subDistrict.name}, {selection.district.name}, {selection.city.name}, {selection.province.name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Total berat: <span className="font-medium text-gray-800">{formatWeight(cartWeight)}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleCheckShipping}
                        disabled={!detailAlamat.rt || !detailAlamat.rw || !detailAlamat.gang || !detailAlamat.nomor_rumah}
                        className={cn(
                          "w-full px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2",
                          (!detailAlamat.rt || !detailAlamat.rw || !detailAlamat.gang || !detailAlamat.nomor_rumah)
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gray-800 hover:bg-gray-900 text-white"
                        )}
                      >
                        <Truck className="w-5 h-5" />
                        Lihat Ongkir Termurah
                      </button>

                      <button
                        onClick={() => {
                          setSelection({ province: null, city: null, district: null, subDistrict: null });
                          setSearchQuery("");
                          setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                        }}
                        className="cursor-pointer w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        Reset Pilihan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === "results" && (
              <div className="space-y-6">
                {loading ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 flex flex-col items-center justify-center">
                    <Loading />
                  </div>
                ) : error ? (
                  <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
                    <p className="text-red-600 mb-6">{error}</p>
                    <button
                      onClick={() => setStep("address")}
                      className="px-6 py-2 cursor-pointer bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Kembali ke Alamat
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-md">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              Pilihan Kurir ({allServices.length})
                            </h3>
                            <p className="text-sm text-gray-600">
                              Gunakan keyboard ⬆⬇ untuk navigasi, Enter untuk memilih
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-125 overflow-y-auto custom-scrollbar">
                        {allServices.map((service, i) => (
                          <div
                            key={`${service.courier}-${service.service}-${i}`}
                            className={cn(
                              "border rounded-lg p-5 cursor-pointer transition-all",
                              i === selectedIndex
                                ? "border-gray-800 bg-gray-50 ring-2 ring-gray-800"
                                : "border-gray-200 hover:border-gray-400"
                            )}
                            onClick={() => setSelectedIndex(i)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                                  <Truck className={cn(
                                    "w-6 h-6",
                                    i === selectedIndex ? "text-gray-800" : "text-gray-600"
                                  )} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-800 uppercase">{service.courier}</h4>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                      {service.service}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">{service.description || "Layanan reguler"}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Estimasi: {service.etd?.toLowerCase() || '-'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-gray-800">
                                  Rp {service.cost?.toLocaleString() || '0'}
                                </p>
                                {i === selectedIndex && (
                                  <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1 mt-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Dipilih
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep("address")}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                        Ganti Alamat
                      </button>
                      <button
                        onClick={() => handleConfirm(allServices[selectedIndex])}
                        className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Pilih & Simpan
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-6">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-gray-800 p-2 rounded-md">
                    <Info className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Ringkasan</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">LOKASI TUJUAN</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {selection.subDistrict
                        ? `${selection.province.name}, ${selection.city.name}`
                        : "Belum dipilih"
                      }
                    </p>
                    {selection.subDistrict && (
                      <>
                        <p className="text-sm text-gray-600">
                          {selection.district.name}, {selection.subDistrict.name}
                        </p>
                        {detailAlamat.gang && (
                          <p className="text-sm text-gray-600 mt-1">
                            {detailAlamat.nomor_rumah} {detailAlamat.gang}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">BERAT PESANAN</p>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-lg font-semibold text-gray-800">
                        {formatWeight(cartWeight)}
                      </span>
                    </div>
                  </div>

                  {step === "results" && allServices[selectedIndex] && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">KURIR DIPILIH</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800 uppercase">
                            {allServices[selectedIndex].courier}
                          </p>
                          <p className="text-sm text-gray-600">
                            {allServices[selectedIndex].service}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-800">
                          Rp {allServices[selectedIndex].cost?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-sm text-gray-600 text-center">
            © {new Date().getFullYear()} Lobaca by Lorelei-Project
          </p>
        </div>
      </footer>
    </div>
  );
}