import BookingCard from './BookingCard';
import '../styles/booking-card.css';

export default function BookingCardGrid(props) {
  const { reservations, ...rest } = props;

  return (
    <div className="booking-card-grid">
      {reservations.map((row) => (
        <BookingCard key={row.id} row={row} {...rest} />
      ))}
    </div>
  );
}
