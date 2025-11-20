import { Box, useToken } from '@chakra-ui/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function MoodChart({ data }) {
  const [cyan200, cyan500] = useToken('colors', ['cyan.200', 'cyan.500']);

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'EEE', { locale: id }),
    score: item.moodScore || 0,
  }));

  return (
    <Box h="200px" w="100%">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cyan500} stopOpacity={0.2} />
              <stop offset="95%" stopColor={cyan200} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.6)"
            tick={{ fill: 'rgba(255,255,255,0.6)' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.6)"
            tick={{ fill: 'rgba(255,255,255,0.6)' }}
            domain={[0, 10]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={cyan500}
            fill="url(#moodGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
