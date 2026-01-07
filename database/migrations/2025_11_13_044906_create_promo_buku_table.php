<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('promo_buku', function (Blueprint $table) {
        $table->id();
        $table->foreignId('promo_id')->constrained()->onDelete('cascade');
        $table->foreignId('buku_id')->constrained('buku', 'buku_id')->onDelete('cascade');
        $table->integer('discount_percent'); 
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promo_buku');
    }
};
