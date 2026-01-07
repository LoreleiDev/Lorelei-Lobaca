<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| These routes serve your SPA (React app) and apply no-cache headers.
|
*/

Route::get('/{any?}', function () {
    return view('welcome');
})->where('any', '.*');
