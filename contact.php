<?php
session_start();
//Import PHPMailer classes into the global namespace
//These must be at the top of your script, not inside a function
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

$name = $_POST['name'];
$email = $_POST['email'];
$phone = $_POST['phone'];
$subject = $_POST['subject'];
$message = $_POST['message'];

  $mail = new PHPMailer(true);

  try {
      $mail->isSMTP();                                         //Send using SMTP
      $mail->Host       = 'smtp.gmail.com';                     //Set the SMTP server to send through
      $mail->SMTPAuth   = true;                                   //Enable SMTP authentication
      $mail->Username   = 'udaykumar.77348@gmail.com';                     //SMTP username
      $mail->Password   = 'sgiggoqtfbxaqwwh';                               //SMTP password
      $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;            //Enable implicit TLS encryption
      $mail->Port       = 465;                                    //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`

      //Recipients
      $mail->setFrom('udaykumar.77348@gmail.com', 'Shekar Portfolio');
      $mail->addAddress('ramgopi@ibridge.digital'); 
      /*$mail->addAddress("info@sosinclasses.com");
      $mail->addAddress('counselor2@sosinclasses.com');
      $mail->addAddress('cd4@sosinclasses.com');
      $mail->addAddress('madhu@sosinclasses.com');*/
      //Content
      $mail->isHTML(true);             
      $mail->Subject = 'Shekar Portfolio ';
      $mail->Body = '
      <table>
        <tr>
          <td>Name</td>
          <td>'.$name.'</td>
        </tr>
        <tr>
          <td>Email</td>
          <td>'.$email.'</td>
        </tr>
        <tr>
          <td>Phone</td>
          <td>'.$phone.'</td>
        </tr>
        <tr>
          <td>Phone</td>
          <td>'.$subject.'</td>
        </tr>
        <tr>
          <td>Message</td>
          <td>'.$message.'</td>
        </tr>
      </table>
    ';
      $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

      	$mail->send();
    	echo 'Message has been sent';
} catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
}