import React from 'react';
import { ContentType, InsuranceProduct } from '../types';

interface ContentDisplayProps {
  contentType: ContentType;
  contentData: any;
  onInsuranceProductClick: (productName: string) => void;
}

const InsuranceCard: React.FC<{ product: InsuranceProduct; onClick: (productName: string) => void }> = ({ product, onClick }) => (
    <div 
        onClick={() => onClick(product.name)}
        className="suggestion-card flex-shrink-0 w-64 bg-surface-light dark:bg-surface-dark rounded-lg p-4 snap-center hover:shadow-glow-primary-light dark:hover:shadow-glow-primary transition-shadow duration-300 cursor-pointer">
        <h4 className="font-semibold text-gray-900 dark:text-white">{product.name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{product.description}</p>
        <div className="flex justify-between items-baseline">
            <p className="text-lg font-bold text-primary">
                {product.monthlyPremium}<span className="text-sm font-medium text-gray-500 dark:text-gray-400">/month</span>
            </p>
            <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-medium text-primary hover:underline">Details</a>
        </div>
    </div>
);


const ContentDisplay: React.FC<ContentDisplayProps> = ({ contentType, contentData, onInsuranceProductClick }) => {
  const renderContent = () => {
    switch (contentType) {
      case 'welcome':
      case 'insurance_list':
        if (!contentData?.products?.length) return null;
        return (
          <div className="w-full max-w-lg animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 px-2">Recommended Plans</h3>
            <div className="flex overflow-x-auto space-x-4 pb-4 snap-x snap-mandatory">
              {contentData.products.map((p: InsuranceProduct) => <InsuranceCard key={p.id} product={p} onClick={onInsuranceProductClick} />)}
            </div>
          </div>
        );
      case 'insurance_detail':
        const product = contentData?.product;
        if (!product) return null;
        return (
            <div className="w-full max-w-3xl suggestion-card bg-surface-light dark:bg-surface-dark rounded-lg p-6 animate-fade-in">
                <div className="uppercase tracking-wide text-sm text-primary font-semibold">{product.category} Insurance</div>
                <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h2>
                 <div className="flex items-baseline gap-8 my-3">
                    <div>
                        <p className="text-2xl text-primary font-semibold">{product.monthlyPremium} <span className="text-base text-gray-500 dark:text-gray-400 font-normal">/month</span></p>
                    </div>
                    <div>
                        <p className="text-2xl text-gray-800 dark:text-gray-200 font-semibold">{product.coverage} <span className="text-base text-gray-500 dark:text-gray-400 font-normal">Coverage</span></p>
                    </div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">{product.description}</p>
                <button className="mt-6 bg-primary text-white font-bold py-2 px-6 rounded-full hover:bg-violet-500 transition-colors">Get a Quote</button>
          </div>
        );
      case 'faq':
        return (
            <div className="w-full max-w-3xl animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">{contentData?.title || 'Frequently Asked Questions'}</h2>
                <div className="space-y-4">
                    {contentData?.faqs?.map((faq: { question: string, answer: string }, index: number) => (
                        <div key={index} className="suggestion-card bg-surface-light dark:bg-surface-dark p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{faq.question}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
        case 'support':
        return (
             <div className="text-center p-8 suggestion-card bg-surface-light dark:bg-surface-dark rounded-lg">
                <h2 className="text-2xl font-bold text-red-500">{contentData?.title}</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{contentData?.message}</p>
             </div>
        )
      default:
        return null;
    }
  };

  return <div className="w-full flex justify-center p-1">{renderContent()}</div>;
};

export default ContentDisplay;