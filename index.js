function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function animate() {
    const container = document.querySelector('.floating-container');
    let currentY = 0;
    let currentRotation = 0;
    
    function updatePosition() {
      const nextY = (Math.random() < 0.5) ? randomBetween(-30, -10) : randomBetween(10, 30);
      const nextRotation = (Math.random() < 0.5) ? randomBetween(-10, -2) : randomBetween(2, 10);
      
      container.animate([
        { transform: `translateY(${currentY}px) rotate(${currentRotation}deg)` },
        { transform: `translateY(${nextY}px) rotate(${nextRotation}deg)` },
        { transform: 'translateY(0px) rotate(0deg)' }
      ], {
        duration: 3000,
        easing: 'ease-in-out',
        fill: 'forwards'
      }).onfinish = () => {
        currentY = 0;
        currentRotation = 0;
        setTimeout(updatePosition, 100); 
      };
    }
    
    updatePosition();
  }

  window.addEventListener('load', animate);
