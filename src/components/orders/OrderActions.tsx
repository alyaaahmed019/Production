import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import { Eye, History, MoreVertical, Pencil, RefreshCw } from 'lucide-react';
import type { ProductionOrder } from '../../types/production';
import { getAllowedTransitions } from '../../utils/workflow';

interface OrderActionsProps {
  order: ProductionOrder;
  onChangeStatus: (order: ProductionOrder) => void;
}

export function OrderActions({ order, onChangeStatus }: OrderActionsProps) {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const canChangeStatus = getAllowedTransitions(order.status).length > 0;

  const close = () => setAnchor(null);
  const open = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  };
  const run = (action: () => void) => () => {
    close();
    action();
  };

  return (
    <>
      <Tooltip title="Order actions">
        <IconButton
          size="small"
          onClick={open}
          aria-label={`Actions for ${order.poNumber}`}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
        >
          <MoreVertical size={18} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={run(() => navigate(`/production/orders/${order.id}`))}>
          <ListItemIcon>
            <Eye size={16} />
          </ListItemIcon>
          <ListItemText>View Order</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(() => navigate(`/production/orders/${order.id}/edit`))}>
          <ListItemIcon>
            <Pencil size={16} />
          </ListItemIcon>
          <ListItemText>Edit Order</ListItemText>
        </MenuItem>
        <MenuItem disabled={!canChangeStatus} onClick={run(() => onChangeStatus(order))}>
          <ListItemIcon>
            <RefreshCw size={16} />
          </ListItemIcon>
          <ListItemText>Change Status</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(() => navigate(`/production/orders/${order.id}#history`))}>
          <ListItemIcon>
            <History size={16} />
          </ListItemIcon>
          <ListItemText>View Production History</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
