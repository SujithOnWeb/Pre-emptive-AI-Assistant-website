import React from 'react';
import { ContentType, InsuranceProduct } from '../types';

interface ContentDisplayProps {
  contentType: ContentType;
  contentData: any;
  onInsuranceProductClick: (productName: string) => void;
}

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
    const colors: { [key: string]: string } = {
        Health: 'bg-blue-900/50 text-blue-300 border-blue-700',
        Auto: 'bg-green-900/50 text-green-300 border-green-700',
        Home: 'bg-amber-900/50 text-amber-300 border-amber-700',
        Life: 'bg-purple-900/50 text-purple-300 border-purple-700',
    }
    return <div className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full border ${colors[category] || 'bg-slate-700'}`}>{category}</div>
}

const InsuranceCard: React.FC<{ product: InsuranceProduct; onClick: (productName: string) => void }> = ({ product, onClick }) => (
  <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 transition-all duration-300 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-900/50 cursor-pointer group relative" onClick={() => onClick(product.name)}>
    <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
    <CategoryBadge category={product.category} />
    <div className="p-4">
      <h3 className="font-bold text-lg text-slate-100">{product.name}</h3>
      <p className="text-slate-400 text-sm mt-1 mb-3 line-clamp-2">{product.description}</p>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-indigo-400 font-semibold text-lg">{product.monthlyPremium}</p>
          <p className="text-xs text-slate-500">/month</p>
        </div>
        <div>
          <p className="text-slate-200 font-semibold text-lg">{product.coverage}</p>
          <p className="text-xs text-slate-500 text-right">Coverage</p>
        </div>
      </div>
    </div>
  </div>
);


const ContentDisplay: React.FC<ContentDisplayProps> = ({ contentType, contentData, onInsuranceProductClick }) => {
  const renderContent = () => {
    switch (contentType) {
      case 'welcome':
        // Welcome message is now handled by the Avatar, so we show nothing here to keep focus.
        return null;
      case 'insurance_list':
        return (
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-6 px-1">Recommended Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {contentData?.products?.map((p: InsuranceProduct) => <InsuranceCard key={p.id} product={p} onClick={onInsuranceProductClick} />)}
            </div>
          </div>
        );
      case 'insurance_detail':
        const product = contentData?.product;
        if (!product) return null;
        return (
          <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700">
            <div className="md:flex">
              <div className="md:flex-shrink-0">
                <img className="h-64 w-full object-cover md:w-64" src={product.imageUrl} alt={product.name} />
              </div>
              <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-indigo-400 font-semibold">{product.category} Insurance</div>
                <h2 className="mt-1 text-3xl font-bold text-slate-100">{product.name}</h2>
                 <div className="flex items-baseline gap-8 my-3">
                    <div>
                        <p className="text-2xl text-indigo-400 font-semibold">{product.monthlyPremium} <span className="text-base text-slate-400 font-normal">/month</span></p>
                    </div>
                    <div>
                        <p className="text-2xl text-slate-200 font-semibold">{product.coverage} <span className="text-base text-slate-400 font-normal">Coverage</span></p>
                    </div>
                </div>
                <p className="mt-4 text-slate-300">{product.description}</p>
                <button className="mt-6 bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-500 transition-colors">Get a Quote</button>
              </div>
            </div>
          </div>
        );
      case 'faq':
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-6">{contentData?.title || 'Frequently Asked Questions'}</h2>
                <div className="space-y-4">
                    {contentData?.faqs?.map((faq: { question: string, answer: string }, index: number) => (
                        <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <h3 className="font-semibold text-slate-200">{faq.question}</h3>
                            <p className="text-slate-400 mt-1">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
        case 'support':
        return (
             <div className="text-center p-8 bg-slate-800/50 rounded-lg border border-slate-700">
                <h2 className="text-2xl font-bold text-red-400">{contentData?.title}</h2>
                <p className="mt-2 text-slate-300">{contentData?.message}</p>
             </div>
        )
      default:
        return null;
    }
  };

  return <div className="p-1 animate-fade-in">{renderContent()}</div>;
};

export default ContentDisplay;