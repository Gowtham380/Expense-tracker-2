import { useState, useMemo } from 'react';

export const useFilter = (data) => {
  const [filters, setFilters] = useState({
    search: '',
    fromDate: '',
    toDate: '',
    type: 'all',
    preset: ''
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = filters.search.toLowerCase();
    
    return data.filter(item => {
      const matchesSearch = !q || (item.desc || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
      const matchesType = filters.type === 'all' || (item.type || '').toLowerCase() === filters.type.toLowerCase();
      let txDate = '';
      if (item.date) {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          txDate = d.toLocaleDateString('sv-SE');
        }
      }
      const matchesDate = (!filters.fromDate || txDate >= filters.fromDate) && (!filters.toDate || txDate <= filters.toDate);
      
      return matchesSearch && matchesType && matchesDate;
    });
  }, [data, filters]);

  return { filters, setFilters, filtered };
};
