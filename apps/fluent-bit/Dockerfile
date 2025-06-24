FROM fluent/fluent-bit:2.2

# Copy your custom config and parsers
COPY fluent-bit.conf /fluent-bit/etc/fluent-bit.conf
COPY parsers.conf /fluent-bit/etc/parsers.conf

# Create storage directory for state and buffering
VOLUME ["/fluent-bit/storage"]

# Set the default command to use your config
CMD ["/fluent-bit/bin/fluent-bit", "-c", "/fluent-bit/etc/fluent-bit.conf"]