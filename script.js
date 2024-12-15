// Initialize form elements
const form = document.querySelector('#bookingForm');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const dateInput = document.querySelector('#date');
const timeInput = document.querySelector('#time');
const purposeInput = document.querySelector('#purpose');
const calendar = document.querySelector('#calendar');
const slotContainer = calendar.querySelector('.timeline-slots');

// Set min date to today to prevent booking past dates
const today = new Date().toISOString().split('T')[0];
dateInput.min = today;

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!timeInput.value) {
        alert('Please select a time slot');
        return;
    }

    const bookingData = {
        name: nameInput.value,
        email: emailInput.value,
        date: dateInput.value,
        time: timeInput.value,
        purpose: purposeInput.value
    };

    try {
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Booking failed');
        }

        form.reset();
        updateCalendarSlots(dateInput.value);
        alert('Booking saved successfully!');
    } catch (error) {
        alert('Error saving booking: ' + error.message);
    }
});

// Update calendar slots based on availability
async function updateCalendarSlots(date) {
    try {
        const [availResponse, bookingsResponse] = await Promise.all([
            fetch(`http://localhost:3000/api/available-slots?date=${date}`),
            fetch(`http://localhost:3000/api/bookings?date=${date}`)
        ]);

        if (!availResponse.ok || !bookingsResponse.ok) {
            throw new Error('Failed to fetch slot data');
        }

        const [availableSlots, bookings] = await Promise.all([
            availResponse.json(),
            bookingsResponse.json()
        ]);

        const slots = slotContainer.querySelectorAll('.slot');
        
        slots.forEach(slot => {
            const slotTime = slot.dataset.time;
            const booking = bookings.find(b => b.time === slotTime && b.date === date);
            const bookerNameEl = slot.querySelector('.booker-name');
            const bookingPurposeEl = slot.querySelector('.booking-purpose');

            const isAvailable = availableSlots.includes(slotTime);
            slot.style.backgroundColor = isAvailable ? '#90EE90' : '#FFB6C1';
            slot.style.cursor = isAvailable ? 'pointer' : 'not-allowed';
            
            if (isAvailable) {
                slot.title = 'Available';
                bookerNameEl.textContent = '';
                bookingPurposeEl.textContent = '';
            } else if (booking) {
                slot.title = `Booked by ${booking.name}`;
                bookerNameEl.textContent = booking.name;
                bookingPurposeEl.textContent = booking.purpose;
            } else {
                slot.title = 'Booked';
                bookerNameEl.textContent = '';
                bookingPurposeEl.textContent = '';
            }
        });

    } catch (error) {
        console.error('Error updating calendar slots:', error);
    }
}

// Update time slots when date is selected
dateInput.addEventListener('change', async () => {
    timeInput.disabled = true;
    
    if (!dateInput.value) {
        timeInput.innerHTML = '<option value="">Select a time</option>';
        timeInput.disabled = false;
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/available-slots?date=${dateInput.value}`);
        if (!response.ok) {
            throw new Error('Failed to fetch available slots');
        }
        
        const data = await response.json();
        timeInput.innerHTML = '<option value="">Select a time</option>';
        
        if (data.length === 0) {
            timeInput.add(new Option('No slots available', ''));
        } else {
            data.forEach(slot => {
                const [hours, minutes] = slot.split(':');
                const period = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                timeInput.add(new Option(`${displayHours}:${minutes} ${period}`, slot));
            });
        }

        updateCalendarSlots(dateInput.value);
    } catch (error) {
        console.error('Error fetching available slots:', error);
        timeInput.innerHTML = '<option value="">Error loading time slots</option>';
    } finally {
        timeInput.disabled = false;
    }
});

// Initialize calendar with today's slots
updateCalendarSlots(today);