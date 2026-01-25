<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pesanan Ditolak</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Halo, {{ $user->first_name }}!</h2>
    <p>Kami mohon maaf, pesanan Anda dengan ID <strong>{{ $transaksi->transaction_id_midtrans }}</strong> telah ditolak oleh admin.</p>
    <p>Jika Anda memiliki pertanyaan, silakan hubungi tim kami.</p>
    <p>Terima kasih,<br><strong>Tim Lobaca</strong></p>
</body>
</html>