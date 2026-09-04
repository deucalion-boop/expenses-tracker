import PropTypes from 'prop-types'
import Input from './Input'
import Select from './Select'
import { boundsFor } from '../../utils/dateRange'

const DateRangeFilter = ({ value, onChange }) => (
  <div className="date-range-filter">
    <Select aria-label="Date range preset" value={value.preset} onChange={(event) => {
      const preset = event.target.value
      onChange({ preset, ...boundsFor(preset) })
    }} options={[{value:'month',label:'This month'},{value:'year',label:'This year'},{value:'all',label:'All time'},{value:'custom',label:'Custom range'}]} />
    {value.preset === 'custom' && <><Input aria-label="Start date" type="date" value={value.startDate} onChange={(event) => onChange({...value,startDate:event.target.value})}/><Input aria-label="End date" type="date" value={value.endDate} onChange={(event) => onChange({...value,endDate:event.target.value})}/></>}
  </div>
)
DateRangeFilter.propTypes = { value: PropTypes.shape({ preset: PropTypes.string, startDate: PropTypes.string, endDate: PropTypes.string }).isRequired, onChange: PropTypes.func.isRequired }
export default DateRangeFilter
