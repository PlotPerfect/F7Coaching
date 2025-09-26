// Stripe Checkout integration template
// Replace 'pk_test_xxx' with your Stripe publishable key
const stripe = Stripe('pk_test_xxx');

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.shop-buy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const priceId = btn.getAttribute('data-stripe-price');
      // Redirect to Stripe Checkout (replace with your backend endpoint)
      fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priceId })
      })
      .then(res => res.json())
      .then(data => {
        if(data.sessionId) {
          stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          alert('Unable to start checkout.');
        }
      })
      .catch(() => alert('Checkout error.'));
    });
  });
});

// Note: You need a backend endpoint '/create-checkout-session' that creates a Stripe Checkout session and returns { sessionId }
// See Stripe docs: https://stripe.com/docs/checkout/quickstart
