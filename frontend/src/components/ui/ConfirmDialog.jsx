import PropTypes from 'prop-types'
import Button from './Button'
import Modal from './Modal'

const ConfirmDialog = ({ open, title, message, confirmLabel = 'Delete', busy = false, onCancel, onConfirm }) => (
  <Modal isOpen={open} onClose={onCancel} title={title}>
    <div className="confirm-dialog"><p>{message}</p><div className="modal-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant="danger" disabled={busy} onClick={onConfirm}>{busy ? 'Deleting...' : confirmLabel}</Button></div></div>
  </Modal>
)
ConfirmDialog.propTypes = { open: PropTypes.bool.isRequired, title: PropTypes.string.isRequired, message: PropTypes.string.isRequired, confirmLabel: PropTypes.string, busy: PropTypes.bool, onCancel: PropTypes.func.isRequired, onConfirm: PropTypes.func.isRequired }
export default ConfirmDialog
