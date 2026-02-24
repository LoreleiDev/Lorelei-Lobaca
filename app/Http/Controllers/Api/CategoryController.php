<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::orderBy('name', 'ASC')->get()->map(function ($category) {
            return [
                'id' => $category->category_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'value' => $category->slug,
                'label' => $category->name,
            ];
        });

        return response()->json($categories);
    }

    public function show($slug)
    {
        $category = Category::where('slug', $slug)->first();

        if (!$category) {
            return response()->json(['message' => 'Kategori tidak ditemukan'], 404);
        }

        return response()->json([
            'id' => $category->category_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'value' => $category->slug,
            'label' => $category->name,
        ]);
    }
}