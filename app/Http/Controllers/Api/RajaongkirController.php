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
    $origin = $request->input('origin');
    $destination = $request->input('destination');
    $weight = $request->input('weight');

    $availableCouriers = ['jne', 'tiki', 'pos', 'sicepat', 'jnt'];

    if (!$origin || !$destination || !$weight) {
        return response()->json(['error' => 'Missing required fields: origin, destination, weight'], 400);
    }

    if (!$this->apiKey) {
        return response()->json(['error' => 'RajaOngkir API key not configured'], 500);
    }

    $allServices = [];

    foreach ($availableCouriers as $courierCode) {
        try {
            $response = Http::withHeaders([
                'key' => $this->apiKey,
            ])->asForm()->post("{$this->apiBaseUrl}/calculate/domestic-cost", [
                        'origin' => $origin,
                        'destination' => (string) $destination,
                        'weight' => (string) $weight,
                        'courier' => $courierCode,
                        'price' => 'lowest',
                    ]);

            if (!$response->successful()) {
                Log::warning("RajaOngkir API error for courier {$courierCode}: " . $response->body());
                continue;
            }

            $data = $response->json();

            if (!isset($data['data']) || !is_array($data['data']) || empty($data['data'])) {
                continue;
            }

            foreach ($data['data'] as $service) {
                $serviceName = $service['service'] ?? 'N/A';
                $serviceCost = (int) ($service['cost'] ?? PHP_INT_MAX);

                $allServices[] = [
                    'courier_code' => $courierCode,
                    'courier' => $service['name'] ?? $courierCode,
                    'service' => $serviceName,
                    'description' => $service['description'] ?? '',
                    'cost' => $serviceCost,
                    'etd' => $service['etd'] ?? '-',
                ];
            }
        } catch (\Exception $e) {
            Log::error("Shipping API error for courier {$courierCode}: " . $e->getMessage());
            continue;
        }
    }

    if (empty($allServices)) {
        return response()->json(['error' => 'Tidak ditemukan layanan pengiriman untuk tujuan ini.'], 400);
    }

    usort($allServices, function ($a, $b) {
        return $a['cost'] <=> $b['cost'];
    });

    $cheapestCost = $allServices[0]['cost'];
    $priceThreshold = $cheapestCost + 5000;

    $filteredServices = array_filter($allServices, function ($service) use ($priceThreshold) {
        return $service['cost'] <= $priceThreshold;
    });

    usort($filteredServices, function ($a, $b) {
        return $a['cost'] <=> $b['cost'];
    });

    $results = [];
    $courierMap = [];

    foreach ($filteredServices as $service) {
        $courierName = $service['courier'];
        $courierCode = $service['courier_code'];

        if (!isset($courierMap[$courierName])) {
            $courierMap[$courierName] = [
                'courier_code' => $courierCode,
                'courier' => $courierName,
                'services' => [],
            ];
        }

        $courierMap[$courierName]['services'][] = [
            'service' => $service['service'],
            'description' => $service['description'],
            'cost' => $service['cost'],
            'etd' => $service['etd'],
        ];
    }

    $results = array_values($courierMap);

    return response()->json(['results' => $results], 200);
}
}