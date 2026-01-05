# Contributing to Aave PNL Generator

Thank you for your interest in contributing! Here are some ways you can help:

## Adding New Tokens

To add support for new tokens:

1. Update `src/config/aave.ts`:
```typescript
export const AAVE_TOKENS = {
  // ... existing tokens
  YOUR_TOKEN: {
    address: '0x...', // Token contract address on BSC
    aToken: '0x...', // Aave aToken address
    decimals: 18,
    symbol: 'YOUR_TOKEN'
  }
};
```

2. Update `src/services/price.service.ts` with CoinGecko ID:
```typescript
private tokenIdMap: Record<string, string> = {
  // ... existing mappings
  '0x...': 'coingecko-id',
};
```

## Improving Price Fetching

- Consider implementing caching strategies
- Add support for alternative price oracles
- Implement fallback price sources

## Enhancing Image Generation

- Add customizable themes
- Support for different card layouts
- Add charts and graphs
- Support for light/dark mode

## Testing

Before submitting a PR:
1. Test with multiple wallet addresses
2. Verify calculations are accurate
3. Ensure images generate correctly
4. Check error handling

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public methods
- Keep functions focused and single-purpose

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request with a clear description

## Ideas for Contributions

- Support for other chains (Ethereum, Polygon, etc.)
- Web interface
- Historical PNL tracking over time
- Yield/APY calculations
- Health factor monitoring
- Liquidation risk alerts
- Export to CSV/JSON
- Email/Discord notifications
