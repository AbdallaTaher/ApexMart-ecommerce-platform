import { Link } from 'react-router-dom';
import { HiExclamationTriangle, HiArrowLeft } from 'react-icons/hi2';
import Button from '../ui/Button';

export default function PageNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="p-4 rounded-full bg-amber-500/10 text-brand-amber mb-4">
        <HiExclamationTriangle className="w-12 h-12" />
      </div>

      <h1 className="text-4xl sm:text-6xl font-black font-display text-gray-900 dark:text-white mb-2">
        404
      </h1>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
        Looking for something?
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-8">
        We're sorry. The Web address you entered is not a functioning page on ApexMart.
        Please check the URL or head back to the marketplace home page.
      </p>

      <Link to="/">
        <Button size="lg" className="inline-flex items-center gap-2">
          <HiArrowLeft className="w-4 h-4" />
          <span>Return to ApexMart Home</span>
        </Button>
      </Link>
    </div>
  );
}
