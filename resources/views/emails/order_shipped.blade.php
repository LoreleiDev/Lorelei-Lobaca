<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pesanan Dikirim!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Halo, {{ $user->first_name }}!</h2>
    <p>Pesanan Anda dengan ID <strong>{{ $transaksi->transaction_id_midtrans }}</strong> telah dikirim.</p>
    <p>Harap menunggu dengan sabar.</p>
    <p>Terima kasih,<br><strong>Tim Lobaca</strong></p>
</body>
</html>