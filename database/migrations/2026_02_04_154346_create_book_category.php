<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('book_categories', function (Blueprint $table) {
            $table->unsignedBigInteger('buku_id');
            $table->unsignedBigInteger('category_id');
            $table->primary(['buku_id', 'category_id']);
            $table->timestamps();

            $table->foreign('buku_id')->references('buku_id')->on('buku')->onDelete('cascade');
            $table->foreign('category_id')->references('category_id')->on('categories')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('book_categories');
    }
};