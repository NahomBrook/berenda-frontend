type Props = {
  title: string;
  price: number;
};

export default function ListingCard({ title, price }: Props) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-gray-600">${price}</p>
    </div>
  );
}