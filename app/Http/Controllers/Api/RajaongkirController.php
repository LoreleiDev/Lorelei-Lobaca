<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class RajaongkirController extends Controller
{
    protected string $apiKey;
    protected string $apiBaseUrl;

    public function __construct()
    {
        $this->apiKey = env('RAJAONGKIR_API_KEY');
        $this->apiBaseUrl = 'https://rajaongkir.komerce.id/api/v1';
    }

    /**
     * Ambil daftar provinsi.
     */
    public function getProvinces(): JsonResponse
    {
        if (!$this->apiKey) {
            return response()->json(['success' => false, 'message' => 'RAJAONGKIR_API_KEY belum diatur.'], 500);
        }

        try {
            $response = Http::withHeaders(['key' => $this->apiKey])
                ->get("{$this->apiBaseUrl}/destination/province");

            if (!$response->successful()) {
                Log::warning('Rajaongkir API getProvinces error: ' . $response->body());
                $errorMessage = $response->json()['meta']['message'] ?? 'Gagal mengambil daftar provinsi dari API.';
                return response()->json(['success' => false, 'message' => $errorMessage], 500);
            }

            $data = $response->json();
            $provinces = $data['data'] ?? [];

            $formattedProvinces = array_map(function ($item) {
                return [
                    'id' => $item['id'] ?? null,
                    'name' => $item['name'] ?? null,
                ];
            }, $provinces);

            return response()->json(['data' => $formattedProvinces], 200);
        } catch (\Exception $e) {
            Log::error('Rajaongkir getProvinces Error: ' . $e->getMessage());
            return response()->json(['error' => 'Terjadi kesalahan internal.'], 500);
        }
    }

    /**
     * Ambil daftar kota berdasarkan province_id.
     */
    public function getCities(Request $request, string $provinceId): JsonResponse
    {
        if (!$this->apiKey) {
            return response()->json(['error' => 'RAJAONGKIR_API_KEY belum diatur.'], 500);
        }

        try {
            $response = Http::withHeaders(['key' => $this->apiKey])
                ->get("{$this->apiBaseUrl}/destination/city/{$provinceId}");

            if (!$response->successful()) {
                Log::warning('Rajaongkir API getCities error: ' . $response->body());
                $errorMessage = $response->json()['meta']['message'] ?? 'Gagal mengambil daftar kota dari API.';
                return response()->json(['error' => $errorMessage], 500);
            }

            $data = $response->json();
            $cities = $data['data'] ?? [];

            $formattedCities = array_map(function ($item) {
                return [
                    'id' => $item['id'] ?? null,
                    'name' => $item['name'] ?? null,
                ];
            }, $cities);

            return response()->json(['data' => $formattedCities], 200);
        } catch (\Exception $e) {
            Log::error('Rajaongkir getCities Error: ' . $e->getMessage());
            return response()->json(['error' => 'Terjadi kesalahan internal.'], 500);
        }
    }

    /**
     * Ambil daftar kecamatan berdasarkan city_id.
     */
    public function getDistricts(Request $request, string $cityId): JsonResponse
    {
        if (!$this->apiKey) {
            return response()->json(['error' => 'RAJAONGKIR_API_KEY belum diatur.'], 500);
        }

        try {
            $response = Http::withHeaders(['key' => $this->apiKey])
                ->get("{$this->apiBaseUrl}/destination/district/{$cityId}");

            if (!$response->successful()) {
                Log::warning('Rajaongkir API getDistricts error: ' . $response->body());
                $errorMessage = $response->json()['meta']['message'] ?? 'Gagal mengambil daftar kecamatan dari API.';
                return response()->json(['error' => $errorMessage], 500);
            }

            $data = $response->json();
            $districts = $data['data'] ?? [];

            $formattedDistricts = array_map(function ($item) {
                return [
                    'id' => $item['id'] ?? null,
                    'name' => $item['name'] ?? null,
                ];
            }, $districts);

            return response()->json(['data' => $formattedDistricts], 200);
        } catch (\Exception $e) {
            Log::error('Rajaongkir getDistricts Error: ' . $e->getMessage());
            return response()->json(['error' => 'Terjadi kesalahan internal.'], 500);
        }
    }

    /**
     * Ambil daftar kelurahan berdasarkan district_id.
     */
    public function getSubDistricts(Request $request, string $districtId): JsonResponse
    {
        if (!$this->apiKey) {
            return response()->json(['error' => 'RAJAONGKIR_API_KEY belum diatur.'], 500);
        }

        try {
            $response = Http::withHeaders(['key' => $this->apiKey])
                ->get("{$this->apiBaseUrl}/destination/sub-district/{$districtId}");

            if (!$response->successful()) {
                Log::warning('Rajaongkir API getSubDistricts error: ' . $response->body());
                $errorMessage = $response->json()['meta']['message'] ?? 'Gagal mengambil daftar kelurahan dari API.';
                return response()->json(['error' => $errorMessage], 500);
            }

            $data = $response->json();
            $subDistricts = $data['data'] ?? [];

            $formattedSubDistricts = array_map(function ($item) {
                return [
                    'id' => $item['id'] ?? null,
                    'name' => $item['name'] ?? null,
                ];
            }, $subDistricts);

            return response()->json(['data' => $formattedSubDistricts], 200);
        } catch (\Exception $e) {
            Log::error('Rajaongkir getSubDistricts Error: ' . $e->getMessage());
            return response()->json(['error' => 'Terjadi kesalahan internal.'], 500);
        }
    }

    /**
     * Hitung ongkir berdasarkan origin, destination, weight, dan courier.
     */
    public function calculateShipping(Request $request): JsonResponse
    {
        // Validasi manual seperti Next.js
        $origin = $request->input('origin');
        $destination = $request->input('destination');
        $weight = $request->input('weight');
        $courier = $request->input('courier');

        if (!$origin || !$destination || !$weight || !$courier) {
            return response()->json(['error' => 'Missing required fields'], 400);
        }

        if (!$this->apiKey) {
            return response()->json(['error' => 'RajaOngkir API key not configured'], 500);
        }

        try {
            // ✅ Kirim sebagai form-urlencoded ke /calculate/domestic-cost
            $response = Http::withHeaders([
                'key' => $this->apiKey,
            ])->asForm()->post("{$this->apiBaseUrl}/calculate/domestic-cost", [
                        'origin' => $origin,
                        'destination' => (string) $destination,
                        'weight' => (string) $weight,
                        'courier' => $courier,
                        'price' => 'lowest',
                    ]);

            if (!$response->successful()) {
                $errorBody = $response->body();
                $errorMessage = 'Terjadi kesalahan saat menghubungi layanan pengiriman.';

                // Coba parse error dari RajaOngkir
                try {
                    $errorJson = json_decode($errorBody, true, 512, JSON_THROW_ON_ERROR);
                    if (isset($errorJson['meta']['message'])) {
                        $errorMessage = $errorJson['meta']['message'];
                    }
                } catch (\Exception $e) {
                    // ignore parse error
                }

                Log::error('RajaOngkir API error: ' . $errorMessage, ['body' => $errorBody]);

                // User-friendly error messages
                if (str_contains(strtolower($errorMessage), 'origin')) {
                    return response()->json(['error' => 'System Origin Error: Please contact support (Origin ID Mismatch)'], 400);
                }
                if (str_contains(strtolower($errorMessage), 'destination')) {
                    return response()->json(['error' => 'Invalid Destination: Please try re-selecting the location'], 400);
                }

                return response()->json(['error' => $errorMessage], 400);
            }

            $data = $response->json();

            if (!isset($data['data']) || !is_array($data['data'])) {
                return response()->json(['error' => 'Unexpected API response structure'], 500);
            }

            // Format seperti Next.js
            $courierMap = [];
            foreach ($data['data'] as $service) {
                $courierName = $service['name'] ?? $service['code'] ?? 'Unknown';
                if (!isset($courierMap[$courierName])) {
                    $courierMap[$courierName] = [];
                }
                $courierMap[$courierName][] = [
                    'service' => $service['service'] ?? 'N/A',
                    'description' => $service['description'] ?? '',
                    'cost' => $service['cost'] ?? 0,
                    'etd' => $service['etd'] ?? '-',
                ];
            }

            $results = [];
            foreach ($courierMap as $courierName => $services) {
                $results[] = [
                    'courier' => $courierName,
                    'services' => $services,
                ];
            }

            return response()->json(['results' => $results], 200);

        } catch (\Exception $e) {
            Log::error('Shipping API error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to fetch shipping costs'], 500);
        }
    }
}