import { useState, useEffect } from "react";
import { ChevronRight, Package, MapPin, Truck, AlertCircle, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
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
    const detailGang = detailAlamat.gang ? `Gang ${detailAlamat.gang}` : "";
    const detailNomor = detailAlamat.nomor_rumah ? `No. ${detailAlamat.nomor_rumah}` : "";
    const detailKeterangan = detailAlamat.keterangan ? `(${detailAlamat.keterangan})` : "";

    const alamatLengkap = [
      fullAddress,
      [detailRT, detailRW].filter(Boolean).join("/"),
      detailGang,
      detailNomor,
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

  if (step === "address" && provinces.length === 0 && loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#f4d03f]">
        <div className="text-2xl font-bold text-black">Memuat provinsi...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4d03f] flex flex-col font-sans overflow-hidden">
      <div className="px-8 pt-8 pb-6 shrink-0">
        <div className="bg-[#f4d03f] border-2 border-black rounded-tl-3xl rounded-tr-md px-6 py-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-bold text-black tracking-wide">
            Atur Alamat & Kurir Pengiriman
          </h1>
        </div>
      </div>

      <main className="flex-1 relative flex flex-col px-8 overflow-hidden">
        <div className="flex gap-4 mb-6 z-10">
          {["address", "results"].map((s, idx) => (
            <div
              key={s}
              className={cn(
                "h-2 flex-1 skew-x-[-20deg] border-2 border-black transition-all duration-300",
                step === s ? "bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" : "bg-white/50",
              )}
            />
          ))}
        </div>

        <div className="flex-1 flex gap-8 relative overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-4 pb-20 scrollbar-hide">
            {step === "address" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-500">
                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="text-2xl font-black italic uppercase mb-4 text-black underline decoration-4 decoration-[#f4d03f] underline-offset-4">
                    Target Pengiriman
                  </h2>
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selection.province && (
                        <span className="bg-black text-white px-3 py-1 text-xs font-black italic uppercase skew-x-[-10deg] relative group">
                          {selection.province.name}
                          <button
                            onClick={() => {
                              setSelection({ province: null, city: null, district: null, subDistrict: null });
                              setCities([]);
                              setDistricts([]);
                              setSubDistricts([]);
                              setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                            }}
                            className="ml-1 text-white hover:text-red-500 absolute -top-1 -right-1 bg-black rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {selection.city && (
                        <span className="bg-black text-white px-3 py-1 text-xs font-black italic uppercase skew-x-[-10deg] relative group">
                          {selection.city.name}
                          <button
                            onClick={() => {
                              setSelection(prev => ({ ...prev, city: null, district: null, subDistrict: null }));
                              setDistricts([]);
                              setSubDistricts([]);
                              setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                            }}
                            className="ml-1 text-white hover:text-red-500 absolute -top-1 -right-1 bg-black rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {selection.district && (
                        <span className="bg-black text-white px-3 py-1 text-xs font-black italic uppercase skew-x-[-10deg] relative group">
                          {selection.district.name}
                          <button
                            onClick={() => {
                              setSelection(prev => ({ ...prev, district: null, subDistrict: null }));
                              setSubDistricts([]);
                              setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                            }}
                            className="ml-1 text-white hover:text-red-500 absolute -top-1 -right-1 bg-black rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {selection.subDistrict && (
                        <span className="bg-[#f4d03f] text-black px-3 py-1 text-xs font-black italic uppercase skew-x-[-10deg] border-2 border-black relative group">
                          {selection.subDistrict.name}
                          <button
                            onClick={() => {
                              setSelection(prev => ({ ...prev, subDistrict: null }));
                              setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                            }}
                            className="ml-1 text-black hover:text-red-700 absolute -top-1 -right-1 bg-[#f4d03f] rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>

                    {!selection.subDistrict && (
                      <div className="relative group">
                        <label className="text-xs font-bold uppercase tracking-widest text-black/60 mb-1 block">
                          Cari {" "}
                          {!selection.province
                            ? "Provinsi"
                            : !selection.city
                              ? "Kota"
                              : !selection.district
                                ? "Kecamatan"
                                : "Kelurahan"}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ketik untuk mencari..."
                            className="w-full bg-white border-b-4 border-black py-4 pl-10 focus:outline-none font-black text-xl italic placeholder:text-black/20 uppercase"
                          />
                          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 text-black" />
                          {isSearching && (
                            <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 animate-spin text-black" />
                          )}
                        </div>
                        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
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
                                  if (!selection.province) handleSelectProvince(item)
                                  else if (!selection.city) handleSelectCity(item)
                                  else if (!selection.district) handleSelectDistrict(item)
                                  else handleSelectSubDistrict(item)
                                }}
                                className="w-full text-left bg-white border-2 border-black p-3 hover:bg-black hover:text-white transition-all font-bold italic uppercase flex justify-between items-center group shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none"
                              >
                                <span>{item.name}</span>
                                <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {selection.subDistrict && (
                      <div className="mt-6 border-t-2 border-black pt-6">
                        <h3 className="text-xl font-black italic uppercase mb-4 text-black">Detail Alamat Tambahan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold uppercase mb-1">RT</label>
                            <input
                              type="text"
                              value={detailAlamat.rt}
                              onChange={(e) => setDetailAlamat(prev => ({ ...prev, rt: e.target.value }))}
                              placeholder="Contoh: 001"
                              className="w-full bg-white border-2 border-black p-2 font-black text-sm placeholder:text-black/30"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold uppercase mb-1">RW</label>
                            <input
                              type="text"
                              value={detailAlamat.rw}
                              onChange={(e) => setDetailAlamat(prev => ({ ...prev, rw: e.target.value }))}
                              placeholder="Contoh: 003"
                              className="w-full bg-white border-2 border-black p-2 font-black text-sm placeholder:text-black/30"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold uppercase mb-1">Komplek</label>
                            <input
                              type="text"
                              value={detailAlamat.gang}
                              onChange={(e) => setDetailAlamat(prev => ({ ...prev, gang: e.target.value }))}
                              placeholder="Contoh: Jl. Mawar 2"
                              className="w-full bg-white border-2 border-black p-2 font-black text-sm placeholder:text-black/30"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold uppercase mb-1">Nomor Rumah</label>
                            <input
                              type="text"
                              value={detailAlamat.nomor_rumah}
                              onChange={(e) => setDetailAlamat(prev => ({ ...prev, nomor_rumah: e.target.value }))}
                              placeholder="Contoh: 123"
                              className="w-full bg-white border-2 border-black p-2 font-black text-sm placeholder:text-black/30"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold uppercase mb-1">Keterangan Tambahan</label>
                            <textarea
                              value={detailAlamat.keterangan}
                              onChange={(e) => setDetailAlamat(prev => ({ ...prev, keterangan: e.target.value }))}
                              placeholder="Contoh: Belakang pasar, dekat warung"
                              className="w-full bg-white border-2 border-black p-2 font-black text-sm resize-none min-h-15 placeholder:text-black/30"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {selection.subDistrict && (
                    <div className="mt-8 space-y-4">
                      <div className="bg-black/5 p-4 border-2 border-dashed border-black italic font-bold">
                        <p className="text-xs uppercase text-black/40 mb-1">Alamat Terpilih:</p>
                        <p className="text-lg">
                          {selection.subDistrict.name}, {selection.district.name}, {selection.city.name}, {selection.province.name}
                        </p>
                        <p className="text-xs mt-2 text-black/60">Berat Total (dari state): {cartWeight}g</p>
                      </div>
                      {detailAlamat.rt && detailAlamat.rw && detailAlamat.gang && detailAlamat.nomor_rumah && detailAlamat.keterangan ? (
                        <button
                          onClick={handleCheckShipping}
                          className="w-full bg-black text-white py-4 font-black italic uppercase text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        >
                          Lihat Ongkir Termurah
                        </button>
                      ) : (
                        <button
                          className="w-full bg-gray-400 text-white py-4 font-black italic uppercase text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] cursor-not-allowed"
                          disabled
                        >
                          Lengkapi Detail Alamat
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelection({ province: null, city: null, district: null, subDistrict: null });
                          setSearchQuery("");
                          setDetailAlamat({ rt: "", rw: "", gang: "", nomor_rumah: "", keterangan: "" });
                        }}
                        className="w-full bg-white border-2 border-black py-2 font-black italic uppercase text-sm"
                      >
                        Reset Pilihan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === "results" && (
              <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col h-full">
                {loading ? (
                  <div className="bg-white border-4 border-black p-20 flex flex-col items-center justify-center gap-6 flex-1">
                    <Loader2 className="w-16 h-16 animate-spin text-black" />
                    <p className="text-2xl font-black italic uppercase tracking-widest">Menghitung...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-500 border-4 border-black p-8 flex-1 flex flex-col items-center justify-center gap-6 text-white">
                    <AlertCircle className="w-12 h-12" />
                    <div className="text-center">
                      <h3 className="text-2xl font-black italic uppercase">Terjadi Kesalahan!</h3>
                      <p className="font-bold opacity-90">{error}</p>
                    </div>
                    <button
                      onClick={() => setStep("address")}
                      className="mt-4 bg-white text-black px-6 py-2 font-black italic uppercase"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="bg-black text-white p-4 mb-4 shadow-[4px_4px_0px_0px_#f4d03f]">
                      <h3 className="text-xl font-black italic uppercase tracking-widest">
                        Semua Ongkir: {allServices.length} Pilihan
                      </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4 space-y-4 max-h-[calc(100vh-300px)] custom-scrollbar">
                      {allServices.map((service, i) => (
                        <div
                          key={`${service.courier}-${service.service}-${i}`}
                          className={cn(
                            "animate-in fade-in slide-in-from-left-8 bg-white border-4 border-black p-6 flex flex-col gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group cursor-pointer",
                            i === selectedIndex
                              ? "bg-yellow-500 border-yellow-500 text-black"
                              : "hover:bg-gray-100"
                          )}
                          style={{ animationDelay: `${i * 50}ms` }}
                          onClick={() => setSelectedIndex(i)}
                        >
                          <div className="absolute top-0 right-0 bg-[#f4d03f] text-black px-4 py-1 font-black italic uppercase translate-x-2 -translate-y-2">
                            {service.courier}
                          </div>
                          <div className="flex items-center justify-between border-b-2 border-black/10 pb-4 last:border-0 last:pb-0">
                            <div>
                              <h4 className="text-xl font-black italic uppercase text-black">{service.service}</h4>
                              <p className="text-sm font-bold text-black/60 uppercase">{service.description || "-"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black italic text-black">Rp {service.cost != null ? service.cost.toLocaleString() : 'N/A'}</p>
                              <p className="text-xs font-bold text-black/40 uppercase tracking-tighter">
                                Estimasi: {service.etd || '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="sticky bottom-0 bg-linear-to-t from-[#f4d03f] to-[#f4d03f]/80 border-t-2 border-black p-4 pt-6 mt-4">
                      <div className="flex gap-4">
                        <button
                          onClick={() => setStep("address")}
                          className="flex-1 bg-white border-4 border-black py-4 font-black italic uppercase text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all"
                        >
                          Ganti Alamat
                        </button>
                        <button
                          onClick={() => handleConfirm(allServices[selectedIndex])}
                          className="flex-1 bg-black text-white py-4 font-black italic uppercase text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        >
                          Pilih & Simpan
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="w-80 hidden lg:flex flex-col gap-6 animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="flex-1 bg-black text-white p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-9 text-white/10 font-black text-8xl pointer-events-none select-none italic -mr-8 -mt-4 uppercase">
                INFO
              </div>
              <h3 className="text-xl font-black italic uppercase mb-4 relative z-10">Status Saat Ini</h3>
              <div className="space-y-4 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Tujuan</span>
                  <span className="text-sm font-black italic uppercase truncate">
                    {selection.subDistrict
                      ? `${selection.province.name}, ${selection.city.name}, ${selection.district.name}, ${selection.subDistrict.name}`
                      : "Belum Dipilih"
                    }
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Berat</span>
                  <span className="text-sm font-black italic uppercase">{cartWeight}g</span>
                </div>
              </div>
              <div className="mt-auto pt-8">
                <div className="text-[10px] font-bold italic uppercase tracking-tighter border-t border-white/20 pt-2 flex justify-between items-center">
                  <span>Lobaca Book Store</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-black text-white px-8 py-3 flex justify-between items-center z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
          </div>
        </div>
      </footer>

      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 skew-x-[-45deg] z-0 pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[-10%] w-[30%] h-[30%] bg-white/20 skew-x-[-25deg] z-0 pointer-events-none" />
    </div>
  );
}